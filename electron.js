const { app } = require('electron');
const path = require('path');

// This file is used by electron-vite-plugin to configure Electron
module.exports = {
  main: {
    // Main process entry
    entry: path.join(__dirname, 'main.js'),
  },
  preload: {
    // Preload scripts
    entry: path.join(__dirname, 'preload.js'),
  },
}; 