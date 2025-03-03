// Direct ESM import for Three.js
import * as THREE from 'three';

// Initialize variables for Three.js
let scene, camera, renderer, cube;

document.addEventListener('DOMContentLoaded', () => {
  const authButton = document.getElementById('auth-button');
  const refreshButton = document.getElementById('get-activities');
  const activitiesContainer = document.getElementById('activities-container');
  const activitiesList = document.getElementById('activities-list');
  const appContainer = document.getElementById('app-container');
  
  // Add pagination controls
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'pagination-controls';
  activitiesContainer.appendChild(paginationContainer);
  
  // Store all activities and pagination state
  let allActivities = [];
  let currentPage = 1;
  const activitiesPerPage = 5;
  
  // Don't add two-column layout or create visualization panel yet
  // We'll do that after authentication
  
  // Rename button to "Refresh Activities"
  refreshButton.textContent = 'Refresh Activities';
  refreshButton.style.display = 'none';
  
  // Set up listener for OAuth callback
  const removeOAuthListener = window.stravaAPI.onOAuthCallbackReceived((data) => {
    if (data.success) {
      // Hide auth button, show refresh button
      authButton.style.display = 'none';
      refreshButton.style.display = 'inline-block';
      
      // Create visualization panel
      createVisualizationPanel();
      
      // Apply two-column layout
      appContainer.classList.add('two-column-layout');
      
      // Automatically fetch activities
      fetchActivities();
    } else {
      console.error('Authentication failed:', data.error);
    }
  });
  
  // Auth button click handler
  authButton.addEventListener('click', async () => {
    try {
      await window.stravaAPI.authenticate();
      // Note: We don't need to do anything here as the OAuth callback will handle the rest
    } catch (error) {
      console.error('Authentication error:', error);
    }
  });
  
  // Refresh activities button click handler
  refreshButton.addEventListener('click', fetchActivities);
  
  // Function to fetch activities
  async function fetchActivities() {
    try {
      // Show loading indicator
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'loading';
      loadingIndicator.textContent = 'Loading activities';
      activitiesList.innerHTML = '';
      activitiesList.appendChild(loadingIndicator);
      
      const result = await window.stravaAPI.getActivities();
      if (result.success) {
        // Store all activities and display first page
        allActivities = result.activities;
        currentPage = 1;
        displayActivitiesPage(currentPage);
      } else {
        // Show error message
        activitiesList.innerHTML = `
          <div class="error">
            Error fetching activities: ${result.error}
          </div>
        `;
        console.error('Error fetching activities:', result.error);
      }
    } catch (error) {
      activitiesList.innerHTML = `
        <div class="error">
          Error: ${error.message}
        </div>
      `;
      console.error('Error:', error);
    }
  }
  
  // Function to display a specific page of activities
  function displayActivitiesPage(page) {
    // Calculate start and end indices
    const startIndex = (page - 1) * activitiesPerPage;
    const endIndex = Math.min(startIndex + activitiesPerPage, allActivities.length);
    const activitiesOnPage = allActivities.slice(startIndex, endIndex);
    
    // Display activities
    displayActivities(activitiesOnPage);
    
    // Update pagination controls
    updatePaginationControls();
  }
  
  // Update pagination buttons
  function updatePaginationControls() {
    const totalPages = Math.ceil(allActivities.length / activitiesPerPage);
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.textContent = '← Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        displayActivitiesPage(currentPage);
      }
    });
    paginationContainer.appendChild(prevButton);
    
    // Page indicator
    const pageIndicator = document.createElement('span');
    pageIndicator.className = 'page-indicator';
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    paginationContainer.appendChild(pageIndicator);
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next →';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        displayActivitiesPage(currentPage);
      }
    });
    paginationContainer.appendChild(nextButton);
  }
  
  function displayActivities(activities) {
    activitiesContainer.style.display = 'block';
    activitiesList.innerHTML = '';
    
    if (activities.length === 0) {
      activitiesList.innerHTML = '<p>No activities found.</p>';
      return;
    }
    
    activities.forEach(activity => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      
      const date = new Date(activity.start_date).toLocaleDateString();
      const distance = (activity.distance / 1000).toFixed(2);
      
      item.innerHTML = `
        <h3>${activity.name}</h3>
        <p>Date: ${date}</p>
        <p>Type: ${activity.type}</p>
        <p>Distance: ${distance} km</p>
        <p>Duration: ${formatDuration(activity.moving_time)}</p>
        <button class="visualize-button">Visualize in 3D</button>
      `;
      
      // Add event listener to the visualize button
      item.querySelector('.visualize-button').addEventListener('click', () => {
        visualizeActivity(activity);
        
        // Highlight selected activity
        document.querySelectorAll('.activity-item').forEach(el => {
          el.classList.remove('selected');
        });
        item.classList.add('selected');
      });
      
      activitiesList.appendChild(item);
    });
    
    // Apply animations to the newly added activities
    applyAnimations();
  }
  
  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours}h ${minutes}m ${secs}s`;
  }
  
  // Function to visualize activity data in 3D
  function visualizeActivity(activity) {
    // Get or create visualization panel
    let visualizationPanel = document.getElementById('visualization-panel');
    if (!visualizationPanel) {
      createVisualizationPanel();
      visualizationPanel = document.getElementById('visualization-panel');
    }
    
    // Make the visualization panel visible
    visualizationPanel.classList.add('active');
    
    // Create a visualization based on activity data
    updateVisualization(activity);
    
    // Apply animations
    applyAnimations();
  }
  
  // Clean up event listener when window is closed
  window.addEventListener('beforeunload', () => {
    if (removeOAuthListener) {
      removeOAuthListener();
    }
  });
});

// Function to create visualization panel - moved from initial setup to be called after authentication
function createVisualizationPanel() {
  // Check if panel already exists
  if (document.getElementById('visualization-panel')) {
    return;
  }
  
  const visualizationPanel = document.createElement('div');
  visualizationPanel.id = 'visualization-panel';
  visualizationPanel.innerHTML = `
    <div id="three-container-wrapper">
      <div id="three-container"></div>
    </div>
    <div id="visualization-info">
      <h3>Select an activity to visualize</h3>
      <p>Click "Visualize in 3D" on any activity to see it represented as a 3D shape.</p>
    </div>
  `;
  
  // Add to app container
  document.getElementById('app-container').appendChild(visualizationPanel);
  
  // Initialize Three.js in the new container
  initThreeJSInContainer();
}

// Move Three.js initialization to a separate function that's called after panel creation
function initThreeJSInContainer() {
  try {
    // Create a scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Create a camera
    camera = new THREE.PerspectiveCamera(
      75, 
      1, // Initial aspect ratio (will be updated)
      0.1, 
      1000
    );
    camera.position.z = 5;
    
    // Create a renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(300, 300); // Initial size (will be updated)
    
    // Add the renderer to the DOM
    const container = document.getElementById('three-container');
    if (container) {
      container.appendChild(renderer.domElement);
      
      // Update renderer size based on container
      updateRendererSize();
    }
    
    // Create a default cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xfc4c02, // Strava orange
      roughness: 0.5,
      metalness: 0.2
    });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    
    // Add some ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add a directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Handle window resize
    window.addEventListener('resize', updateRendererSize);
    
    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      
      if (cube) {
        // Rotate the cube
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
      }
      
      renderer.render(scene, camera);
    }
    
    animate();
    
  } catch (error) {
    console.error('Error initializing Three.js:', error);
  }
}

// Update renderer size based on container
function updateRendererSize() {
  const container = document.getElementById('three-container');
  if (container && renderer) {
    const width = container.clientWidth;
    const height = container.clientHeight || width; // Square if height not specified
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
}

// Function to update visualization based on activity data
function updateVisualization(activity) {
  // Clear any existing visualization (except the cube)
  scene.children.forEach(child => {
    if (child !== cube && !(child instanceof THREE.Light)) {
      scene.remove(child);
    }
  });
  
  // Remove the default cube from the scene
  if (cube) {
    scene.remove(cube);
  }
  
  // Normalize activity metrics
  const distance = activity.distance / 1000; // km
  const duration = activity.moving_time / 60; // minutes
  
  // Calculate size based on distance (capped between 0.5 and 3)
  const size = Math.min(Math.max(distance / 10, 0.5), 3);
  
  // Calculate color based on activity type
  let color;
  switch (activity.type) {
    case 'Run':
      color = 0xff4500; // OrangeRed
      break;
    case 'Ride':
      color = 0x1e90ff; // DodgerBlue
      break;
    case 'Swim':
      color = 0x00bfff; // DeepSkyBlue
      break;
    default:
      color = 0x9370db; // MediumPurple
  }
  
  // Calculate complexity (number of segments) based on duration
  const segments = Math.min(Math.max(Math.floor(duration / 5), 3), 16);
  
  // Create a geometry based on activity type
  let geometry;
  let mesh;
  
  if (activity.type === 'Run') {
    // Use a torus for running
    geometry = new THREE.TorusGeometry(size, size/3, segments, segments * 2);
    mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.5,
      metalness: 0.2
    }));
  } else if (activity.type === 'Ride') {
    // Use an icosahedron for cycling
    geometry = new THREE.IcosahedronGeometry(size, Math.floor(segments/4));
    mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.3,
      metalness: 0.5
    }));
  } else if (activity.type === 'Swim') {
    // Use a torus knot for swimming
    geometry = new THREE.TorusKnotGeometry(size, size/4, segments * 2, segments);
    mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.1,
      metalness: 0.8
    }));
  } else {
    // Default to dodecahedron for other activities
    geometry = new THREE.DodecahedronGeometry(size, Math.floor(segments/4));
    mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.4,
      metalness: 0.3
    }));
  }
  
  // Add to scene
  scene.add(mesh);
  
  // Store reference to replace the cube
  cube = mesh;
  
  // Reset camera position
  camera.position.z = size * 2 + 3;
  
  // Update information text
  const activityInfo = document.createElement('div');
  activityInfo.className = 'activity-info';
  activityInfo.innerHTML = `
    <h3>3D Visualization: ${activity.name}</h3>
    <p>Shape is based on activity type. Size is based on distance (${distance.toFixed(2)} km).</p>
    <p>Complexity is based on duration (${duration.toFixed(0)} minutes).</p>
  `;
  
  const infoContainer = document.getElementById('visualization-info');
  if (infoContainer) {
    infoContainer.innerHTML = '';
    infoContainer.appendChild(activityInfo);
  }
  
  // Update renderer size
  updateRendererSize();
}

// Enable HMR (Hot Module Replacement)
if (import.meta.hot) {
  import.meta.hot.accept();
}

// Add this function to apply animations to new elements
function applyAnimations() {
  // Add animation class to new activities
  document.querySelectorAll('.activity-item:not(.animated)').forEach((item, index) => {
    setTimeout(() => {
      item.classList.add('new-activity', 'animated');
    }, index * 100); // Stagger the animations
  });
  
  // Add pulse animation to visualization panel when active
  const visualizationPanel = document.getElementById('visualization-panel');
  if (visualizationPanel && visualizationPanel.classList.contains('active')) {
    const wrapper = document.getElementById('three-container-wrapper');
    wrapper.classList.add('pulse');
    
    // Remove pulse after a few seconds
    setTimeout(() => {
      wrapper.classList.remove('pulse');
    }, 3000);
  }
} 