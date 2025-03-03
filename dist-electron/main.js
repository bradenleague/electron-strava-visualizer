"use strict";
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
require("url");
const Store = require("electron-store");
const axios = require("axios");
const http = require("http");
require("dotenv").config();
const store = new Store();
let mainWindow;
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
process.env.VITE_NAME;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      webSecurity: true,
      sandbox: false
    }
  });
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
app.on("ready", createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
ipcMain.handle("authenticate", async () => {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = "http://localhost:3000";
  const scope = "read,activity:read";
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  startHttpServer();
  shell.openExternal(authUrl);
  return { success: true };
});
let httpServer = null;
function startHttpServer() {
  if (httpServer) return;
  httpServer = http.createServer(async (req, res) => {
    const urlObj = new URL(req.url, "http://localhost:3000");
    const code = urlObj.searchParams.get("code");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.writeHead(200, { "Content-Type": "text/html" });
    if (code) {
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
              <\/script>
            </body>
            </html>
          `);
          if (mainWindow) {
            mainWindow.webContents.send("oauth-callback-received", { success: true });
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
          if (mainWindow) {
            mainWindow.webContents.send("oauth-callback-received", { success: false, error: result.error });
          }
        }
      } catch (error) {
        console.error("Error handling OAuth code:", error);
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
        if (mainWindow) {
          mainWindow.webContents.send("oauth-callback-received", { success: false, error: error.message });
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
    closeHttpServer();
  });
  httpServer.listen(3e3, () => {
    console.log("HTTP server is running on http://localhost:3000");
  });
  httpServer.on("error", (error) => {
    console.error("HTTP server error:", error);
    if (error.code === "EADDRINUSE") {
      console.log("Port 3000 is already in use. Trying to close the existing server...");
      closeHttpServer();
      setTimeout(() => {
        startHttpServer();
      }, 1e3);
    }
  });
}
function closeHttpServer() {
  if (httpServer) {
    httpServer.close(() => {
      console.log("HTTP server closed");
      httpServer = null;
    });
  }
}
async function handleOAuthCode(code) {
  try {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code"
    });
    const { access_token, refresh_token, expires_at } = response.data;
    store.set("strava.access_token", access_token);
    store.set("strava.refresh_token", refresh_token);
    store.set("strava.expires_at", expires_at);
    return { success: true };
  } catch (error) {
    console.error("Error exchanging code for token:", error);
    return { success: false, error: error.message };
  }
}
app.on("will-quit", () => {
  closeHttpServer();
});
ipcMain.handle("getActivities", async () => {
  try {
    const expiresAt = store.get("strava.expires_at");
    const now = Math.floor(Date.now() / 1e3);
    if (now >= expiresAt) {
      await refreshToken();
    }
    const accessToken = store.get("strava.access_token");
    const response = await axios.get("https://www.strava.com/api/v3/athlete/activities", {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      },
      params: {
        per_page: 10
      }
    });
    return { success: true, activities: response.data };
  } catch (error) {
    console.error("Error fetching activities:", error);
    return { success: false, error: error.message };
  }
});
async function refreshToken() {
  try {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    const refreshToken2 = store.get("strava.refresh_token");
    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken2,
      grant_type: "refresh_token"
    });
    const { access_token, refresh_token, expires_at } = response.data;
    store.set("strava.access_token", access_token);
    store.set("strava.refresh_token", refresh_token);
    store.set("strava.expires_at", expires_at);
    return true;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return false;
  }
}
