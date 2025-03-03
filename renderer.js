document.addEventListener('DOMContentLoaded', () => {
  const authButton = document.getElementById('auth-button');
  const refreshButton = document.getElementById('refresh-button');
  const authSection = document.getElementById('auth-section');
  const activitiesSection = document.getElementById('activities-section');
  const activitiesList = document.getElementById('activities-list');
  const loadingElement = document.getElementById('loading');
  const errorElement = document.getElementById('error');
  
  // Set up listener for OAuth callback
  const removeOAuthListener = window.stravaAPI.onOAuthCallbackReceived((data) => {
    if (data.success) {
      // Show activities section
      authSection.classList.add('hidden');
      activitiesSection.classList.remove('hidden');
      
      // Fetch activities
      fetchActivities();
    } else {
      showError('Authentication failed: ' + (data.error || 'Unknown error'));
    }
    hideLoading();
  });
  
  // Auth button click handler
  authButton.addEventListener('click', async () => {
    showLoading();
    try {
      await window.stravaAPI.authenticate();
    } catch (error) {
      showError('Failed to start authentication: ' + error.message);
      hideLoading();
    }
  });
  
  // Refresh button click handler
  refreshButton.addEventListener('click', () => {
    fetchActivities();
  });
  
  // Fetch activities from Strava
  async function fetchActivities() {
    showLoading();
    activitiesList.innerHTML = '';
    
    try {
      const result = await window.stravaAPI.getActivities();
      
      if (result.success) {
        if (result.activities.length === 0) {
          activitiesList.innerHTML = '<p>No activities found.</p>';
        } else {
          result.activities.forEach(activity => {
            const activityCard = document.createElement('div');
            activityCard.className = 'activity-card';
            
            const date = new Date(activity.start_date).toLocaleDateString();
            const distance = (activity.distance / 1000).toFixed(2); // Convert to km
            const duration = formatDuration(activity.moving_time);
            
            activityCard.innerHTML = `
              <div class="activity-title">${activity.name}</div>
              <div class="activity-details">
                <span>${activity.type}</span>
                <span>${date}</span>
              </div>
              <div class="activity-details">
                <span>${distance} km</span>
                <span>${duration}</span>
              </div>
            `;
            
            activitiesList.appendChild(activityCard);
          });
        }
        
        // Show activities section
        authSection.classList.add('hidden');
        activitiesSection.classList.remove('hidden');
      } else {
        showError('Failed to fetch activities: ' + result.error);
      }
    } catch (error) {
      showError('Error fetching activities: ' + error.message);
    }
    
    hideLoading();
  }
  
  // Helper function to format duration
  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours}h ${minutes}m ${secs}s`;
  }
  
  // Helper functions for UI
  function showLoading() {
    loadingElement.classList.remove('hidden');
    errorElement.classList.add('hidden');
  }
  
  function hideLoading() {
    loadingElement.classList.add('hidden');
  }
  
  function showError(message) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
  }
  
  // Clean up event listener when window is closed
  window.addEventListener('beforeunload', () => {
    if (removeOAuthListener) {
      removeOAuthListener();
    }
  });
}); 