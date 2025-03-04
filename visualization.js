// Import Three.js
import * as THREE from 'three';

// Module for handling 3D visualizations of Strava activities
export class ActivityVisualizer {
  constructor(containerId) {
    this.containerId = containerId;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.currentMesh = null;
    this.animationId = null;
    this.initialized = false;
  }

  // Initialize the Three.js scene, camera, and renderer
  initialize() {
    if (this.initialized) return;
    
    try {
      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xf0f0f0);
      
      // Create camera
      this.camera = new THREE.PerspectiveCamera(
        75, 
        1, // Initial aspect ratio (will be updated)
        0.1, 
        1000
      );
      this.camera.position.z = 5;
      
      // Create renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(300, 300); // Initial size (will be updated)
      
      // Add renderer to DOM
      const container = document.getElementById(this.containerId);
      if (container) {
        container.appendChild(this.renderer.domElement);
        this.updateRendererSize();
      } else {
        throw new Error(`Container with ID "${this.containerId}" not found`);
      }
      
      // Add lighting
      this.setupLighting();
      
      // Create default visualization
      this.createDefaultVisualization();
      
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

  // Set up scene lighting
  setupLighting() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
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
      
      if (this.currentMesh) {
        // Rotate the mesh
        this.currentMesh.rotation.x += 0.01;
        this.currentMesh.rotation.y += 0.01;
      }
      
      this.renderer.render(this.scene, this.camera);
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
    
    // Reset camera position based on mesh size
    const size = this.calculateSizeFromActivity(activity);
    this.camera.position.z = size * 2 + 3;
    
    // Update renderer
    this.updateRendererSize();
    
    return {
      activityName: activity.name,
      distance: (activity.distance / 1000).toFixed(2), // km
      duration: (activity.moving_time / 60).toFixed(0) // minutes
    };
  }

  // Clear existing visualization
  clearVisualization() {
    if (this.currentMesh) {
      this.scene.remove(this.currentMesh);
      this.currentMesh.geometry.dispose();
      this.currentMesh.material.dispose();
      this.currentMesh = null;
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
      
      // Create a path from the coordinates
      const curve = new THREE.CatmullRomCurve3(
        normalizedCoords.map(coord => new THREE.Vector3(coord.x, coord.y, coord.elevation / 100))
      );
      
      // Create tube geometry from the path
      const size = this.calculateSizeFromActivity(activity);
      const tubeRadius = size / 20;
      const tubularSegments = Math.min(coordinates.length * 2, 200);
      const radialSegments = 8;
      
      const geometry = new THREE.TubeGeometry(
        curve,
        tubularSegments,
        tubeRadius,
        radialSegments,
        false
      );
      
      // Create material based on activity type
      const color = this.getColorForActivityType(activity.type);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0.7,
      });
      
      // Create mesh
      const routeMesh = new THREE.Mesh(geometry, material);
      
      // Add elevation markers if significant elevation changes
      if (elevationData && this.hasSignificantElevationChanges(normalizedCoords)) {
        const elevationMarkers = this.createElevationMarkers(normalizedCoords, color);
        routeMesh.add(elevationMarkers);
      }
      
      return routeMesh;
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

  // Clean up resources
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.clearVisualization();
    
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