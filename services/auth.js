// Store tokens in localStorage
const TOKEN_STORAGE_KEY = 'strava_tokens';

// Determine if we're in development or production
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

// Check if we're in a web deployment
const isWebDeployment = process.env.DEPLOYMENT_TYPE === 'web';

// Base URL for API requests - always use /api for Vercel deployments
const API_BASE_URL = '/api';

export const authService = {
  // Get stored tokens
  getTokens() {
    const tokensJson = localStorage.getItem(TOKEN_STORAGE_KEY);
    return tokensJson ? JSON.parse(tokensJson) : null;
  },
  
  // Save tokens to localStorage
  saveTokens(tokens) {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  },
  
  // Clear tokens (logout)
  clearTokens() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  },
  
  // Check if user is authenticated
  isAuthenticated() {
    const tokens = this.getTokens();
    return !!tokens && !!tokens.access_token;
  },
  
  // Check if token is expired
  isTokenExpired() {
    const tokens = this.getTokens();
    if (!tokens) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return now >= tokens.expires_at;
  },
  
  // Start OAuth flow
  authenticate() {
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
    // Use the appropriate redirect URI based on deployment type
    const redirectUri = window.location.origin + '/callback.html';
    const scope = 'read,activity:read';
    
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    
    // Redirect to Strava authorization page
    window.location.href = authUrl;
  },
  
  // Handle OAuth callback
  async handleCallback(code) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth?code=${code}`);
      const data = await response.json();
      
      if (data.success) {
        this.saveTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at
        });
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error handling callback:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Refresh token
  async refreshToken() {
    try {
      const tokens = this.getTokens();
      if (!tokens || !tokens.refresh_token) {
        return { success: false, error: 'No refresh token available' };
      }
      
      const response = await fetch(`${API_BASE_URL}/refresh?refresh_token=${tokens.refresh_token}`);
      const data = await response.json();
      
      if (data.success) {
        this.saveTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at
        });
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get activities
  async getActivities() {
    try {
      // Check if token is expired
      if (this.isTokenExpired()) {
        const refreshResult = await this.refreshToken();
        if (!refreshResult.success) {
          return refreshResult;
        }
      }
      
      const tokens = this.getTokens();
      const response = await fetch(`${API_BASE_URL}/activities`, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      return { success: false, error: error.message };
    }
  }
}; 