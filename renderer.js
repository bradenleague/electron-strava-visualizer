// Direct ESM import for Three.js
import * as THREE from 'three';
// Import our visualization module
import { ActivityVisualizer } from './visualization.js';
// Import the auth service
import { authService } from './services/auth.js';

// Check if we're running in Electron or web browser
const isElectron = window && window.process && window.process.type;

// Initialize variables
let visualizer = null;
let useMetricUnits = false; // Default to imperial (miles)

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
  
  // Check if user is already authenticated
  if (authService.isAuthenticated()) {
    // Hide auth button, show refresh button
    authButton.style.display = 'none';
    refreshButton.style.display = 'inline-block';
    
    // Create visualization panel
    createVisualizationPanel();
    
    // Apply two-column layout
    appContainer.classList.add('two-column-layout');
    
    // Automatically fetch activities
    fetchActivities();
  }
  
  // Auth button click handler
  authButton.addEventListener('click', () => {
    authService.authenticate();
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
      
      const result = await authService.getActivities();
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
    
    // Create a visualization based on activity data using our new module
    const activityInfo = visualizer.visualizeActivity(activity);
    
    // Update information text
    const infoContainer = document.getElementById('visualization-info');
    if (infoContainer) {
      // Calculate values based on user's unit preference
      const distanceValue = useMetricUnits ? 
        activity.distance / 1000 : // kilometers
        activity.distance / 1609.34; // miles
      
      const distanceUnit = useMetricUnits ? 'km' : 'mi';
      const elevationUnit = useMetricUnits ? 'm' : 'ft';
      
      // Calculate pace (minutes per mile/km)
      const paceSeconds = activity.moving_time / (useMetricUnits ? 
        (activity.distance / 1000) : // seconds per km
        (activity.distance / 1609.34)); // seconds per mile
      const paceMinutes = Math.floor(paceSeconds / 60);
      const paceRemainingSeconds = Math.floor(paceSeconds % 60);
      const paceFormatted = `${paceMinutes}:${paceRemainingSeconds.toString().padStart(2, '0')}`;
      
      // Format elevation if available
      let elevationInfo = '';
      if (activity.total_elevation_gain) {
        const elevationValue = useMetricUnits ? 
          activity.total_elevation_gain : // meters
          activity.total_elevation_gain * 3.28084; // feet
        elevationInfo = `<p>Elevation Gain: ${elevationValue.toFixed(0)} ${elevationUnit}</p>`;
      }
      
      // Format heart rate if available
      let heartRateInfo = '';
      if (activity.average_heartrate) {
        heartRateInfo = `<p>Avg Heart Rate: ${Math.round(activity.average_heartrate)} bpm</p>`;
      }
      
      // Format date
      const activityDate = new Date(activity.start_date);
      const dateFormatted = activityDate.toLocaleDateString();
      const timeFormatted = activityDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      const activityInfoEl = document.createElement('div');
      activityInfoEl.className = 'activity-info';
      activityInfoEl.innerHTML = `
        <div class="activity-header">
          <h3>${activity.name}</h3>
          <div class="units-toggle">
            <label>
              <input type="checkbox" id="units-toggle" ${useMetricUnits ? 'checked' : ''}>
              Use Metric (km)
            </label>
          </div>
        </div>
        <div class="activity-stats">
          <p><strong>Type:</strong> ${activity.type}</p>
          <p><strong>Date:</strong> ${dateFormatted} at ${timeFormatted}</p>
          <p><strong>Distance:</strong> ${distanceValue.toFixed(2)} ${distanceUnit}</p>
          <p><strong>Duration:</strong> ${formatDuration(activity.moving_time)}</p>
          <p><strong>Pace:</strong> ${paceFormatted} min/${distanceUnit}</p>
          ${elevationInfo}
          ${heartRateInfo}
        </div>
        <div class="visualization-explanation">
          <p><small>3D shape based on activity type. Size represents distance, complexity represents duration.</small></p>
        </div>
      `;
      
      infoContainer.innerHTML = '';
      infoContainer.appendChild(activityInfoEl);
      
      // Add event listener to the units toggle
      document.getElementById('units-toggle').addEventListener('change', (e) => {
        useMetricUnits = e.target.checked;
        visualizeActivity(activity); // Redisplay with new units
      });
    }
    
    // Apply animations
    applyAnimations();
  }
  
  // Clean up event listener when window is closed
  window.addEventListener('beforeunload', () => {
    // Clean up visualizer
    if (visualizer) {
      visualizer.dispose();
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
  
  // Initialize our visualizer with the container ID
  visualizer = new ActivityVisualizer('three-container');
  visualizer.initialize();
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