#!/bin/bash

cd "$(dirname "$0")/.."

echo "Checking backend dependencies..."
if [ ! -d "backend/node_modules" ]; then
  echo "Installing backend dependencies..."
  cd backend && npm install && cd ..
fi

echo "Checking frontend dependencies..."
if [ ! -d "frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

echo "Building frontend..."
cd frontend
npm run build

if [ $? -ne 0 ]; then
  echo "✗ Frontend build failed"
  exit 1
fi

echo "✓ Build completed"
