"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("stravaAPI", {
  authenticate: () => ipcRenderer.invoke("authenticate"),
  handleCallback: (code) => ipcRenderer.invoke("handleCallback", code),
  getActivities: () => ipcRenderer.invoke("getActivities"),
  onOAuthCallbackReceived: (callback) => {
    ipcRenderer.on("oauth-callback-received", (_, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners("oauth-callback-received");
    };
  }
});
