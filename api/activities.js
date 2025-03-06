const axios = require('axios');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
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
} 