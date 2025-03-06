const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Auth endpoint
app.get('/auth', async (req, res) => {
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
});

// Refresh token endpoint
app.get('/refresh', async (req, res) => {
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
});

// Activities endpoint
app.get('/activities', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No access token provided' });
  }
  
  const accessToken = authHeader.split(' ')[1];
  
  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        per_page: 10
      }
    });
    
    return res.status(200).json({ 
      success: true, 
      activities: response.data 
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch activities'
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Development server running at http://localhost:${PORT}`);
}); 