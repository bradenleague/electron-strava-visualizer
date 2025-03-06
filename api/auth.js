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
  
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ success: false, error: 'No authorization code provided' });
  }
  
  try {
    const clientId = process.env.VITE_STRAVA_CLIENT_ID;
    const clientSecret = process.env.VITE_STRAVA_CLIENT_SECRET;
    
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code'
    });
    
    const { access_token, refresh_token, expires_at } = response.data;
    
    // Return tokens to the client
    return res.status(200).json({ 
      success: true, 
      access_token,
      refresh_token,
      expires_at
    });
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to exchange authorization code for token'
    });
  }
} 