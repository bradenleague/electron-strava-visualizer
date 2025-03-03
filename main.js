const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const url = require('url');
const Store = require('electron-store');
const axios = require('axios');
const http = require('http');
require('dotenv').config();

// Store for saving tokens
const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools in development
  // mainWindow.webContents.openDevTools();
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle OAuth2 authentication
ipcMain.handle('authenticate', async () => {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = 'http://localhost:3000';
  const scope = 'read,activity:read';
  
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  
  // Start HTTP server before opening the auth URL
  startHttpServer();
  
  shell.openExternal(authUrl);
  
  return { success: true };
});

// HTTP server for handling OAuth callback
let httpServer = null;

function startHttpServer() {
  // If server is already running, return
  if (httpServer) return;
  
  httpServer = http.createServer(async (req, res) => {
    const urlObj = new URL(req.url, 'http://localhost:3000');
    const code = urlObj.searchParams.get('code');
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Send a simple success page
    res.writeHead(200, { 'Content-Type': 'text/html' });
    
    if (code) {
      // Handle the OAuth code
      try {
        const result = await handleOAuthCode(code);
        if (result.success) {
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Strava Authorization</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  text-align: center;
                  padding: 40px;
                  background-color: #f5f5f5;
                }
                .container {
                  max-width: 500px;
                  margin: 0 auto;
                  background-color: white;
                  padding: 30px;
                  border-radius: 8px;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                h1 {
                  color: #fc4c02;
                }
                p {
                  margin: 20px 0;
                  color: #333;
                }
                .success-icon {
                  font-size: 48px;
                  margin-bottom: 20px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="success-icon">✅</div>
                <h1>Authorization Successful!</h1>
                <p>You have successfully connected to Strava.</p>
                <p>You can close this window and return to the app.</p>
              </div>
              <script>
                // Close the window after 3 seconds
                setTimeout(() => {
                  window.close();
                }, 3000);
              </script>
            </body>
            </html>
          `);
          
          // Notify the renderer process
          if (mainWindow) {
            mainWindow.webContents.send('oauth-callback-received', { success: true });
          }
        } else {
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Strava Authorization</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  text-align: center;
                  padding: 40px;
                  background-color: #f5f5f5;
                }
                .container {
                  max-width: 500px;
                  margin: 0 auto;
                  background-color: white;
                  padding: 30px;
                  border-radius: 8px;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                h1 {
                  color: #e34402;
                }
                p {
                  margin: 20px 0;
                  color: #333;
                }
                .error-icon {
                  font-size: 48px;
                  margin-bottom: 20px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="error-icon">❌</div>
                <h1>Authorization Failed</h1>
                <p>There was a problem connecting to Strava.</p>
                <p>Please try again.</p>
              </div>
            </body>
            </html>
          `);
          
          // Notify the renderer process
          if (mainWindow) {
            mainWindow.webContents.send('oauth-callback-received', { success: false, error: result.error });
          }
        }
      } catch (error) {
        console.error('Error handling OAuth code:', error);
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Strava Authorization</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                text-align: center;
                padding: 40px;
                background-color: #f5f5f5;
              }
              .container {
                max-width: 500px;
                margin: 0 auto;
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              h1 {
                color: #e34402;
              }
              p {
                margin: 20px 0;
                color: #333;
              }
              .error-icon {
                font-size: 48px;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error-icon">❌</div>
              <h1>Authorization Failed</h1>
              <p>There was a problem connecting to Strava.</p>
              <p>Error: ${error.message}</p>
            </div>
          </body>
          </html>
        `);
        
        // Notify the renderer process
        if (mainWindow) {
          mainWindow.webContents.send('oauth-callback-received', { success: false, error: error.message });
        }
      }
    } else {
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Strava Authorization</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              text-align: center;
              padding: 40px;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
              background-color: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            h1 {
              color: #e34402;
            }
            p {
              margin: 20px 0;
              color: #333;
            }
            .error-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">❓</div>
            <h1>Missing Authorization Code</h1>
            <p>No authorization code was received from Strava.</p>
            <p>Please try again.</p>
          </div>
        </body>
        </html>
      `);
    }
    
    // Close the server after handling the request
    closeHttpServer();
  });
  
  httpServer.listen(3000, () => {
    console.log('HTTP server is running on http://localhost:3000');
  });
  
  // Handle server errors
  httpServer.on('error', (error) => {
    console.error('HTTP server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.log('Port 3000 is already in use. Trying to close the existing server...');
      closeHttpServer();
      // Try to start the server again after a short delay
      setTimeout(() => {
        startHttpServer();
      }, 1000);
    }
  });
}

function closeHttpServer() {
  if (httpServer) {
    httpServer.close(() => {
      console.log('HTTP server closed');
      httpServer = null;
    });
  }
}

// Handle OAuth code in the main process
async function handleOAuthCode(code) {
  try {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code'
    });
    
    const { access_token, refresh_token, expires_at } = response.data;
    
    // Save tokens to electron-store
    store.set('strava.access_token', access_token);
    store.set('strava.refresh_token', refresh_token);
    store.set('strava.expires_at', expires_at);
    
    return { success: true };
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return { success: false, error: error.message };
  }
}

// Clean up the HTTP server when the app is quitting
app.on('will-quit', () => {
  closeHttpServer();
});

// Get user's activities
ipcMain.handle('getActivities', async () => {
  try {
    // Check if token is expired
    const expiresAt = store.get('strava.expires_at');
    const now = Math.floor(Date.now() / 1000);
    
    if (now >= expiresAt) {
      // Refresh token
      await refreshToken();
    }
    
    const accessToken = store.get('strava.access_token');
    
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        per_page: 10
      }
    });
    
    return { success: true, activities: response.data };
  } catch (error) {
    console.error('Error fetching activities:', error);
    return { success: false, error: error.message };
  }
});

// Refresh token
async function refreshToken() {
  try {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    const refreshToken = store.get('strava.refresh_token');
    
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });
    
    const { access_token, refresh_token, expires_at } = response.data;
    
    // Update tokens in store
    store.set('strava.access_token', access_token);
    store.set('strava.refresh_token', refresh_token);
    store.set('strava.expires_at', expires_at);
    
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
} 