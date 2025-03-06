# Strava Electron Visualizer

A dual-purpose application that works both as an Electron desktop app and as a web application deployable to Vercel.

## Features

- Connect with Strava using OAuth
- View your Strava activities
- Visualize your activities in 3D
- Works both as a desktop app and a web app

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with your Strava API credentials:

```
VITE_STRAVA_CLIENT_ID=your_client_id
VITE_STRAVA_CLIENT_SECRET=your_client_secret
```

### Running in Development Mode

To run the application in development mode:

```bash
npm run dev
```

This will start both the Vite development server and the API server.

## Building

### Building for Electron (Desktop)

To build the application for desktop:

```bash
npm run dist
```

This will create a distributable package in the `release` directory.

### Building for Web (Vercel)

To build the application for web deployment:

```bash
npm run vercel-build
```

This will create a web-optimized build in the `dist` directory.

## Deployment

### Deploying to Vercel

1. Connect your GitHub repository to Vercel
2. Set the following environment variables in Vercel:
   - `VITE_STRAVA_CLIENT_ID`: Your Strava Client ID
   - `VITE_STRAVA_CLIENT_SECRET`: Your Strava Client Secret
   - `DEPLOYMENT_TYPE`: Set to `web`
3. Deploy the application

### Vercel Configuration

The application uses the following Vercel configuration:

- Build Command: `npm run vercel-build`
- Output Directory: `dist`
- Environment Variables: See above

## License

ISC

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



