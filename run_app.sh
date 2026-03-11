#!/bin/bash

# Configuration
BACKEND_DIR="Backend"
FRONTEND_DIR="frontend"

echo "🚀 Starting HRS Application..."

# 1. Start Backend in background
echo "🟢 Starting Backend Service (FastAPI)..."
cd "$BACKEND_DIR"
source hrs_venv/bin/activate
uvicorn api:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# 2. Start Frontend
echo "🔵 Starting Frontend (Next.js)..."
cd "$FRONTEND_DIR"
npm run dev -- --port 3000 &
FRONTEND_PID=$!
cd ..

echo "✅ HRS is spinning up!"
echo "📍 Backend: http://localhost:8000"
echo "📍 Frontend: http://localhost:3000"
echo "---"
echo "Press Ctrl+C to stop both services."

# Trap Ctrl+C to kill both background processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
