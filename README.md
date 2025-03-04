# Strava Activity Visualizer

A desktop application that connects to Strava and creates 3D visualizations of your activities using Three.js and Electron.

## Features

- OAuth2 authentication with Strava
- Fetch and display your recent activities
- Create 3D visualizations of activities
- Interactive 3D controls (rotate, zoom, pan)
- Support for different activity types (Run, Ride, Swim, etc.)
- Route visualization with elevation data
- Metric/Imperial unit toggle
- Post-processing effects (bloom, outline, anti-aliasing)

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- A Strava API application (for client ID and secret)

## Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd strava-electron-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your Strava API credentials:
   ```
   NODE_ENV=development
   STRAVA_CLIENT_ID=your_client_id
   STRAVA_CLIENT_SECRET=your_client_secret
   ```

   Replace `your_client_id` and `your_client_secret` with your actual Strava API credentials from https://www.strava.com/settings/api

## Development

To run the app in development mode: 
```
npm run dev
```

This will start both the Vite dev server and Electron app.

## Building

To build the application:
```
npm run dist


This will create a distributable package in the `release` directory.

## Project Structure

- `main.js` - Electron main process
- `preload.js` - Preload script for secure IPC communication
- `renderer.js` - Frontend application logic
- `visualization.js` - 3D visualization module using Three.js
- `index.html` - Main application window

## Technology Stack

- Electron - Desktop application framework
- Three.js - 3D graphics library
- Axios - HTTP client for API requests
- electron-store - Persistent storage

## Notes

- The Strava API has rate limits that may affect data fetching



