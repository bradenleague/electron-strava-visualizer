// Direct ESM import for Three.js
import * as THREE from 'three';

// Initialize Three.js
initThreeJS();

document.addEventListener('DOMContentLoaded', () => {
  const authButton = document.getElementById('auth-button');
  const getActivitiesButton = document.getElementById('get-activities');
  const activitiesContainer = document.getElementById('activities-container');
  const activitiesList = document.getElementById('activities-list');
  
  // Set up listener for OAuth callback
  const removeOAuthListener = window.stravaAPI.onOAuthCallbackReceived((data) => {
    if (data.success) {
      // Show get activities button
      getActivitiesButton.style.display = 'inline-block';
    } else {
      console.error('Authentication failed:', data.error);
    }
  });
  
  // Auth button click handler
  authButton.addEventListener('click', async () => {
    try {
      await window.stravaAPI.authenticate();
      getActivitiesButton.style.display = 'inline-block';
    } catch (error) {
      console.error('Authentication error:', error);
    }
  });
  
  // Get activities button click handler
  getActivitiesButton.addEventListener('click', async () => {
    try {
      const result = await window.stravaAPI.getActivities();
      if (result.success) {
        displayActivities(result.activities);
      } else {
        console.error('Error fetching activities:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
  
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
      `;
      
      activitiesList.appendChild(item);
    });
  }
  
  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours}h ${minutes}m ${secs}s`;
  }
  
  // Clean up event listener when window is closed
  window.addEventListener('beforeunload', () => {
    if (removeOAuthListener) {
      removeOAuthListener();
    }
  });
});

// Three.js Integration
function initThreeJS() {
  try {
    // Create a scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Create a camera
    const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    camera.position.z = 5;
    
    // Create a renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Add the renderer to the DOM
    const container = document.getElementById('three-container');
    if (container) {
      container.appendChild(renderer.domElement);
    }
    
    // Create a cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xfc4c02, // Strava orange
      wireframe: true 
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    
    // Add some ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add a directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      
      // Rotate the cube
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      
      renderer.render(scene, camera);
    }
    
    animate();
    
  } catch (error) {
    console.error('Error initializing Three.js:', error);
  }
}

// Enable HMR (Hot Module Replacement)
if (import.meta.hot) {
  import.meta.hot.accept();
} 