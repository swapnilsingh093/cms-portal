#!/bin/bash

# ==============================================================
# Modern CMS Portal - Mac 1-Click Launcher
# ==============================================================

echo "=========================================================="
echo "🚀 Starting Modern CMS Portal (Mac Launcher)"
echo "=========================================================="

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Verify Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not found!"
    echo "Please install Node.js from https://nodejs.org or via Homebrew (brew install node)"
    read -p "Press Enter to exit..."
    exit 1
fi

# Clean up any previously orphaned processes on ports 5001 and 5173
lsof -ti :5001 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true

# Start Backend
echo "📡 [1/2] Launching Node.js Backend on port 5001..."
cd "$DIR/backend"
node server.js &
BACKEND_PID=$!

# Start Frontend
echo "💻 [2/2] Launching React Frontend on port 5173..."
cd "$DIR/frontend"
node ./node_modules/vite/bin/vite.js &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo "✅ Both Backend & Frontend are online!"
echo "🌐 Public Portal: http://localhost:5173"
echo "🛠️ Backend API:   http://localhost:5001"
echo "🔑 Default Admin: admin@portal.com / admin123"
echo "=========================================================="
echo ""
echo "Press [CTRL+C] at any time to stop both servers."

# Open browser automatically after brief delay
(sleep 3 && open http://localhost:5173) &

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM EXIT
wait
