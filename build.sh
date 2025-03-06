#!/bin/bash
echo "Installing dependencies..."
npm install

echo "Building the application..."
npm run vercel-build

echo "Build completed!" 