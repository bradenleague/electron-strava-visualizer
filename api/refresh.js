const axios = require('axios');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { refresh_token } = req.query;
  
  if (!refresh_token) {
    return res.status(400).json({ success: false, error: 'No refresh token provided' });
  }
  
  try {
    const clientId = process.env.VITE_STRAVA_CLIENT_ID;
    const clientSecret = process.env.VITE_STRAVA_CLIENT_SECRET;
    
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refresh_token,
      grant_type: 'refresh_token'
    });
    
    const { access_token, refresh_token: new_refresh_token, expires_at } = response.data;
    
    // Return new tokens to the client
    return res.status(200).json({ 
      success: true, 
      access_token,
      refresh_token: new_refresh_token,
      expires_at
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to refresh token'
    });
  }
} 