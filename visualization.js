// Import Three.js
import * as THREE from 'three';
// Import camera controls
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// Import post-processing modules
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

// Module for handling 3D visualizations of Strava activities
export class ActivityVisualizer {
  constructor(containerId) {
    this.containerId = containerId;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null; // Add camera controls
    this.composer = null; // Add effect composer for post-processing
    this.currentMesh = null;
    this.animationId = null;
    this.initialized = false;
    this.outlinePass = null; // For highlighting objects
  }

  // Initialize the Three.js scene, camera, and renderer
  initialize() {
    if (this.initialized) return;
    
    try {
      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x161616); // Darker background for better contrast
      
      // Create camera
      this.camera = new THREE.PerspectiveCamera(
        60, // Wider FOV for better visibility
        1, // Initial aspect ratio (will be updated)
        0.1, 
        1000
      );
      this.camera.position.set(0, -5, 5); // Position camera to view route from an angle
      
      // Create renderer
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
      });
      this.renderer.setSize(300, 300); // Initial size (will be updated)
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.enabled = true; // Enable shadows
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      // Add renderer to DOM
      const container = document.getElementById(this.containerId);
      if (container) {
        container.appendChild(this.renderer.domElement);
        this.updateRendererSize();
      } else {
        throw new Error(`Container with ID "${this.containerId}" not found`);
      }
      
      // Setup camera controls
      this.setupControls();
      
      // Add lighting
      this.setupLighting();
      
      // Create default visualization
      this.createDefaultVisualization();
      
      // Setup post-processing
      this.setupPostProcessing();
      
      // Set up resize handler
      window.addEventListener('resize', () => this.updateRendererSize());
      
      // Start animation loop
      this.startAnimationLoop();
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing Three.js:', error);
      throw error;
    }
  }

  // Set up camera controls
  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // Add smooth damping effect
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.8;
    this.controls.zoomSpeed = 1.2;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 20;
    this.controls.target.set(0, 0, 0); // Look at center by default
    this.controls.update();
  }

  // Set up post-processing effects
  setupPostProcessing() {
    // Create composer
    this.composer = new EffectComposer(this.renderer);
    
    // Add render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Add glow effect
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.4, // Bloom strength
      0.4, // Bloom radius
      0.85 // Bloom threshold
    );
    this.composer.addPass(bloomPass);
    
    // Add outline effect for routes
    this.outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.scene,
      this.camera
    );
    this.outlinePass.edgeStrength = 3.0;
    this.outlinePass.edgeGlow = 0.7;
    this.outlinePass.edgeThickness = 2.0;
    this.outlinePass.pulsePeriod = 0; // No pulse
    this.outlinePass.visibleEdgeColor.set(0xffffff);
    this.outlinePass.hiddenEdgeColor.set(0x888888);
    this.composer.addPass(this.outlinePass);
    
    // Add anti-aliasing
    const fxaaPass = new ShaderPass(FXAAShader);
    this.composer.addPass(fxaaPass);
    
    // Update FXAA uniforms based on pixel ratio
    const pixelRatio = this.renderer.getPixelRatio();
    fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
    fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
  }

  // Set up scene lighting
  setupLighting() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    
    // Add directional light with shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    this.scene.add(directionalLight);
    
    // Add a secondary light from below for more dimension
    const secondaryLight = new THREE.DirectionalLight(0x6495ED, 0.4); // SteelBlue
    secondaryLight.position.set(-2, -4, -2);
    this.scene.add(secondaryLight);
  }

  // Create default visualization (cube)
  createDefaultVisualization() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xfc4c02, // Strava orange
      roughness: 0.5,
      metalness: 0.2
    });
    this.currentMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.currentMesh);
  }

  // Start animation loop
  startAnimationLoop() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      // Update controls
      if (this.controls) {
        this.controls.update();
      }
      
      // Use effect composer instead of renderer directly
      if (this.composer) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    };
    
    animate();
  }

  // Update renderer size based on container
  updateRendererSize() {
    const container = document.getElementById(this.containerId);
    if (container && this.renderer && this.camera) {
      const width = container.clientWidth;
      const height = container.clientHeight || width; // Square if height not specified
      
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      
      // Update effect composer
      if (this.composer) {
        this.composer.setSize(width, height);
        
        // Update FXAA uniforms
        const pixelRatio = this.renderer.getPixelRatio();
        const fxaaPass = this.composer.passes.find(pass => pass.material && pass.material.uniforms.resolution);
        if (fxaaPass) {
          fxaaPass.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio);
          fxaaPass.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio);
        }
      }
    }
  }

  // Visualize a specific activity
  visualizeActivity(activity) {
    if (!this.initialized) {
      this.initialize();
    }
    
    // Remove existing visualization
    this.clearVisualization();
    
    // Create new visualization based on activity
    let mesh;
    
    // Check if activity has route data (in Strava format)
    if (activity.map && activity.map.summary_polyline) {
      mesh = this.createRouteVisualization(activity);
    } else {
      mesh = this.createActivityMesh(activity);
    }
    
    this.scene.add(mesh);
    this.currentMesh = mesh;
    
    // Reset camera position for better view
    if (activity.map && activity.map.summary_polyline) {
      // For routes, position camera to view from an angle
      this.camera.position.set(0, -5, 3);
      this.controls.target.set(0, 0, 0);
    } else {
      // For generic activity meshes
      const size = this.calculateSizeFromActivity(activity);
      this.camera.position.set(0, -size * 2, size * 2);
      this.controls.target.set(0, 0, 0);
    }
    
    // Update controls
    this.controls.update();
    
    // Add mesh to outline pass for highlighting
    if (this.outlinePass) {
      this.outlinePass.selectedObjects = [mesh];
    }
    
    // Add a grid to help with elevation perception
    this.addGridHelper();
    
    // Update renderer
    this.updateRendererSize();
    
    return {
      activityName: activity.name,
      distance: (activity.distance / 1000).toFixed(2), // km
      duration: (activity.moving_time / 60).toFixed(0) // minutes
    };
  }

  // Add a grid helper to visualize the ground plane
  addGridHelper() {
    // Remove existing grid if present
    this.scene.children.forEach(child => {
      if (child instanceof THREE.GridHelper) {
        this.scene.remove(child);
      }
    });
    
    // Create a new grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x555555, 0x222222);
    gridHelper.position.y = -2; // Position grid below the visualization
    this.scene.add(gridHelper);
  }

  // Clear existing visualization
  clearVisualization() {
    if (this.currentMesh) {
      // Remove from scene
      this.scene.remove(this.currentMesh);
      
      // Recursively dispose of all geometries and materials
      this.disposeObject(this.currentMesh);
      
      this.currentMesh = null;
    }
  }

  // Recursively dispose of an object and its children
  disposeObject(object) {
    if (!object) return;
    
    // Dispose of geometry and material if they exist on this object
    if (object.geometry) {
      object.geometry.dispose();
    }
    
    if (object.material) {
      // Material might be an array in some cases
      if (Array.isArray(object.material)) {
        object.material.forEach(material => material.dispose());
      } else {
        object.material.dispose();
      }
    }
    
    // Handle points material if it exists
    if (object.userData && object.userData.pointLight) {
      object.userData.pointLight = null;
    }
    
    // Recursively dispose children
    if (object.children && object.children.length > 0) {
      // Create a copy of the children array to avoid modification during iteration
      const children = [...object.children];
      children.forEach(child => {
        this.disposeObject(child);
      });
      object.children.length = 0; // Clear the children array
    }
  }

  // Calculate size based on activity distance
  calculateSizeFromActivity(activity) {
    const distance = activity.distance / 1000; // km
    return Math.min(Math.max(distance / 10, 0.5), 3); // Cap between 0.5 and 3
  }

  // Calculate segments based on activity duration
  calculateSegmentsFromActivity(activity) {
    const duration = activity.moving_time / 60; // minutes
    return Math.min(Math.max(Math.floor(duration / 5), 3), 16); // Cap between 3 and 16
  }

  // Get color based on activity type
  getColorForActivityType(type) {
    switch (type) {
      case 'Run': return 0xff4500; // OrangeRed
      case 'Ride': return 0x1e90ff; // DodgerBlue
      case 'Swim': return 0x00bfff; // DeepSkyBlue
      default: return 0x9370db; // MediumPurple
    }
  }

  // Create mesh based on activity
  createActivityMesh(activity) {
    const size = this.calculateSizeFromActivity(activity);
    const segments = this.calculateSegmentsFromActivity(activity);
    const color = this.getColorForActivityType(activity.type);
    
    let geometry, material;
    
    switch (activity.type) {
      case 'Run':
        // Torus for running
        geometry = new THREE.TorusGeometry(size, size/3, segments, segments * 2);
        material = new THREE.MeshStandardMaterial({ 
          color: color,
          roughness: 0.5,
          metalness: 0.2
        });
        break;
        
      case 'Ride':
        // Icosahedron for cycling
        geometry = new THREE.IcosahedronGeometry(size, Math.floor(segments/4));
        material = new THREE.MeshStandardMaterial({ 
          color: color,
          roughness: 0.3,
          metalness: 0.5
        });
        break;
        
      case 'Swim':
        // Torus knot for swimming
        geometry = new THREE.TorusKnotGeometry(size, size/4, segments * 2, segments);
        material = new THREE.MeshStandardMaterial({ 
          color: color,
          roughness: 0.1,
          metalness: 0.8
        });
        break;
        
      default:
        // Dodecahedron for other activities
        geometry = new THREE.DodecahedronGeometry(size, Math.floor(segments/4));
        material = new THREE.MeshStandardMaterial({ 
          color: color,
          roughness: 0.4,
          metalness: 0.3
        });
    }
    
    return new THREE.Mesh(geometry, material);
  }

  // Create a 3D visualization from route data
  createRouteVisualization(activity) {
    try {
      // Decode the polyline to get coordinates
      const coordinates = this.decodePolyline(activity.map.summary_polyline);
      
      if (!coordinates || coordinates.length < 2) {
        console.warn('Not enough coordinates in route data, falling back to default visualization');
        return this.createActivityMesh(activity);
      }
      
      // Get elevation data if available
      let elevationData = null;
      if (activity.streams && activity.streams.altitude) {
        elevationData = activity.streams.altitude.data;
      }
      
      // Normalize coordinates to center the route
      const normalizedCoords = this.normalizeCoordinates(coordinates, elevationData);
      
      // Create a group to hold the route visualization
      const routeGroup = new THREE.Group();
      
      // Create a path from the coordinates
      const curve = new THREE.CatmullRomCurve3(
        normalizedCoords.map(coord => new THREE.Vector3(coord.x, coord.y, coord.elevation / 100))
      );
      
      // Create tube geometry from the path with increased quality
      const size = this.calculateSizeFromActivity(activity);
      const tubeRadius = size / 15; // Slightly thicker for better visibility
      const tubularSegments = Math.min(coordinates.length * 3, 300); // More segments for smoother curves
      const radialSegments = 12; // Increased for better quality
      
      const geometry = new THREE.TubeGeometry(
        curve,
        tubularSegments,
        tubeRadius,
        radialSegments,
        false
      );
      
      // Create material based on activity type with enhanced appearance
      const color = this.getColorForActivityType(activity.type);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.2,
        metalness: 0.8,
        emissive: new THREE.Color(color).multiplyScalar(0.2), // Slight glow
        flatShading: false // Smooth shading
      });
      
      // Create mesh with shadows
      const routeMesh = new THREE.Mesh(geometry, material);
      routeMesh.castShadow = true;
      routeMesh.receiveShadow = true;
      
      routeGroup.add(routeMesh);
      
      // Add elevation markers with improved visibility
      if (elevationData && this.hasSignificantElevationChanges(normalizedCoords)) {
        const elevationMarkers = this.createElevationMarkers(normalizedCoords, color);
        routeGroup.add(elevationMarkers);
      }
      
      // Add start/end markers
      const startMarker = this.createSpecialMarker(
        normalizedCoords[0], 
        0x00ff00, // Green for start
        0.08
      );
      const endMarker = this.createSpecialMarker(
        normalizedCoords[normalizedCoords.length - 1], 
        0xff0000, // Red for end
        0.08
      );
      
      routeGroup.add(startMarker);
      routeGroup.add(endMarker);
      
      // Add elevation profile visualization
      const elevationProfile = this.createElevationProfile(normalizedCoords, color);
      if (elevationProfile) {
        elevationProfile.position.y = -1.5; // Position below the route
        routeGroup.add(elevationProfile);
      }
      
      return routeGroup;
    } catch (error) {
      console.error('Error creating route visualization:', error);
      return this.createActivityMesh(activity);
    }
  }
  
  // Decode Google encoded polyline to get coordinates
  // Algorithm from: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
  decodePolyline(polyline) {
    if (!polyline) return null;
    
    const coordinates = [];
    let index = 0;
    const len = polyline.length;
    let lat = 0;
    let lng = 0;
    
    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      
      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      
      shift = 0;
      result = 0;
      
      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      
      coordinates.push({
        lat: lat / 1e5,
        lon: lng / 1e5,
        elevation: 0 // Default to 0, will be updated if elevation data is available
      });
    }
    
    return coordinates;
  }
  
  // Normalize coordinates to center the route and scale appropriately
  normalizeCoordinates(coordinates, elevationData) {
    // Find min/max values
    let minLat = Infinity, maxLat = -Infinity;
    let minLon = Infinity, maxLon = -Infinity;
    let minEle = Infinity, maxEle = -Infinity;
    
    coordinates.forEach((coord, index) => {
      minLat = Math.min(minLat, coord.lat);
      maxLat = Math.max(maxLat, coord.lat);
      minLon = Math.min(minLon, coord.lon);
      maxLon = Math.max(maxLon, coord.lon);
      
      // If elevation data is available, use it
      if (elevationData && elevationData[index] !== undefined) {
        coord.elevation = elevationData[index];
        minEle = Math.min(minEle, coord.elevation);
        maxEle = Math.max(maxEle, coord.elevation);
      }
    });
    
    // Calculate center and range
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;
    const latRange = maxLat - minLat;
    const lonRange = maxLon - minLon;
    
    // Scale factor to fit in a reasonable size
    const scale = 2 / Math.max(latRange, lonRange);
    
    // If no elevation data is available, create synthetic elevation
    if (!elevationData || minEle === maxEle) {
      // Create synthetic elevation data based on distance from center
      coordinates.forEach((coord, index) => {
        // Create some hills and valleys based on position
        const distFromCenter = Math.sqrt(
          Math.pow((coord.lat - centerLat) / latRange, 2) + 
          Math.pow((coord.lon - centerLon) / lonRange, 2)
        );
        
        // Add some variation based on index to create a more interesting terrain
        const variation = Math.sin(index / coordinates.length * Math.PI * 8);
        
        // Make elevation proportional to distance from center + variation
        coord.elevation = distFromCenter * 100 + variation * 30;
        
        minEle = Math.min(minEle, coord.elevation);
        maxEle = Math.max(maxEle, coord.elevation);
      });
    }
    
    // Normalize coordinates
    return coordinates.map(coord => ({
      x: (coord.lon - centerLon) * scale,
      y: (coord.lat - centerLat) * scale,
      elevation: coord.elevation,
      normalizedElevation: (coord.elevation - minEle) / (maxEle - minEle || 1)
    }));
  }
  
  // Check if the route has significant elevation changes
  hasSignificantElevationChanges(normalizedCoords) {
    if (normalizedCoords.length < 2) return false;
    
    let minEle = Infinity, maxEle = -Infinity;
    
    normalizedCoords.forEach(coord => {
      minEle = Math.min(minEle, coord.elevation);
      maxEle = Math.max(maxEle, coord.elevation);
    });
    
    // Consider significant if elevation difference is more than 50 meters
    return (maxEle - minEle) > 50;
  }
  
  // Create elevation markers for visualization
  createElevationMarkers(normalizedCoords, baseColor) {
    const markersGroup = new THREE.Group();
    
    // Create markers at high and low points
    const highPoints = this.findLocalExtrema(normalizedCoords, true);
    const lowPoints = this.findLocalExtrema(normalizedCoords, false);
    
    // Create high point markers
    highPoints.forEach(point => {
      const marker = this.createMarker(
        normalizedCoords[point], 
        0xff0000, // Red for high points
        0.05
      );
      markersGroup.add(marker);
    });
    
    // Create low point markers
    lowPoints.forEach(point => {
      const marker = this.createMarker(
        normalizedCoords[point], 
        0x0000ff, // Blue for low points
        0.05
      );
      markersGroup.add(marker);
    });
    
    return markersGroup;
  }
  
  // Create a marker at a specific point
  createMarker(point, color, size) {
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5
    });
    
    const marker = new THREE.Mesh(geometry, material);
    marker.position.set(point.x, point.y, point.elevation / 100);
    
    return marker;
  }
  
  // Find local extrema (peaks and valleys) in the elevation data
  findLocalExtrema(coords, findMaxima, windowSize = 10) {
    const result = [];
    
    for (let i = windowSize; i < coords.length - windowSize; i++) {
      let isExtrema = true;
      
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (i === j) continue;
        
        if (findMaxima) {
          // Looking for maxima
          if (coords[j].elevation >= coords[i].elevation) {
            isExtrema = false;
            break;
          }
        } else {
          // Looking for minima
          if (coords[j].elevation <= coords[i].elevation) {
            isExtrema = false;
            break;
          }
        }
      }
      
      if (isExtrema) {
        result.push(i);
        i += windowSize; // Skip ahead to avoid finding too many close points
      }
    }
    
    // Limit to a reasonable number of markers
    if (result.length > 5) {
      // Sort by elevation difference and take the most significant ones
      const sortedIndices = [...result].sort((a, b) => {
        return Math.abs(coords[b].elevation - coords[b-1].elevation) - 
               Math.abs(coords[a].elevation - coords[a-1].elevation);
      });
      
      return sortedIndices.slice(0, 5);
    }
    
    return result;
  }

  // Create a special marker (for start/end points)
  createSpecialMarker(point, color, size) {
    const markerGroup = new THREE.Group();
    
    // Create sphere
    const sphereGeometry = new THREE.SphereGeometry(size, 16, 16);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8
    });
    
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.castShadow = true;
    
    // Add pulsing light
    const pointLight = new THREE.PointLight(color, 1, 1);
    pointLight.position.set(0, 0, 0);
    
    markerGroup.add(sphere);
    markerGroup.add(pointLight);
    markerGroup.position.set(point.x, point.y, point.elevation / 100);
    
    // Store the initial creation time for animation
    markerGroup.userData.creationTime = Date.now();
    markerGroup.userData.pointLight = pointLight;
    
    // Add animation function
    markerGroup.userData.animate = function() {
      const elapsedTime = (Date.now() - this.userData.creationTime) / 1000;
      const intensity = 0.5 + 0.5 * Math.sin(elapsedTime * 3);
      this.userData.pointLight.intensity = intensity;
    };
    
    return markerGroup;
  }
  
  // Create elevation profile visualization
  createElevationProfile(normalizedCoords, color) {
    if (normalizedCoords.length < 2) return null;
    
    const profileGroup = new THREE.Group();
    
    // Create a line showing the elevation profile
    const points = [];
    const profileWidth = 2; // Width of the profile display
    
    normalizedCoords.forEach((coord, index) => {
      const x = (index / (normalizedCoords.length - 1)) * profileWidth - profileWidth / 2;
      const z = coord.normalizedElevation * 0.5; // Scale height
      points.push(new THREE.Vector3(x, 0, z));
    });
    
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: color, 
      linewidth: 2 // Only works in Firefox and Safari
    });
    
    const line = new THREE.Line(lineGeometry, lineMaterial);
    profileGroup.add(line);
    
    // Add fill below the line for better visibility
    const shape = new THREE.Shape();
    shape.moveTo(points[0].x, points[0].z);
    points.forEach(p => shape.lineTo(p.x, p.z));
    shape.lineTo(points[points.length - 1].x, 0);
    shape.lineTo(points[0].x, 0);
    
    const shapeGeometry = new THREE.ShapeGeometry(shape);
    const shapeMaterial = new THREE.MeshBasicMaterial({ 
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    // Convert the X-Z plane shape to X-Y for proper display
    const shapeMesh = new THREE.Mesh(shapeGeometry, shapeMaterial);
    shapeMesh.rotation.x = -Math.PI / 2; // Rotate to face up
    
    profileGroup.add(shapeMesh);
    
    return profileGroup;
  }

  // Clean up resources
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.clearVisualization();
    
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    
    if (this.composer) {
      this.composer.dispose();
      this.composer = null;
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      
      const container = document.getElementById(this.containerId);
      if (container && this.renderer.domElement) {
        container.removeChild(this.renderer.domElement);
      }
    }
    
    window.removeEventListener('resize', this.updateRendererSize);
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.initialized = false;
  }
} 