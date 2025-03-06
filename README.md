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
   VITE_STRAVA_CLIENT_ID=your_client_id
   VITE_STRAVA_CLIENT_SECRET=your_client_secret
   ```

   Replace `your_client_id` and `your_client_secret` with your actual Strava API credentials from https://www.strava.com/settings/api

## Development

To run the app in development mode: 
```
npm run dev
```

This will start both the Vite dev server and Electron app.

## Development with API Server

For local development, the application uses a development server to handle API requests. This server is automatically started when you run `npm run dev`.

If you need to run the development server separately, you can use:

```
node dev-server.js
```

The development server runs on port 3000 and handles the following endpoints:

- `/auth` - Handles OAuth authentication
- `/refresh` - Refreshes access tokens
- `/activities` - Fetches activities from Strava

These endpoints are proxied through the Vite development server, so in your code, you can use `/api/auth`, `/api/refresh`, and `/api/activities`.

## Building

To build the application:
```
npm run dist
```

This will create a distributable package in the `release` directory.

## Deploying to Vercel

1. Create a Vercel account if you don't have one already.

2. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

3. Login to Vercel:
   ```
   vercel login
   ```

4. Deploy the application:
   ```
   vercel
   ```

5. Set up environment variables in the Vercel dashboard:
   - `VITE_STRAVA_CLIENT_ID`: Your Strava Client ID
   - `VITE_STRAVA_CLIENT_SECRET`: Your Strava Client Secret

## Project Structure

- `main.js` - Electron main process
- `preload.js` - Preload script for secure IPC communication
- `renderer.js` - Frontend application logic
- `visualization.js` - 3D visualization module using Three.js
- `index.html` - Main application window
- `api/` - Serverless functions for Vercel deployment
- `services/` - Frontend services for authentication and API calls

## Technology Stack

- Electron - Desktop application framework
- Three.js - 3D graphics library
- Axios - HTTP client for API requests
- electron-store - Persistent storage
- Vercel - Deployment platform for web version

## Notes

- The Strava API has rate limits that may affect data fetching



