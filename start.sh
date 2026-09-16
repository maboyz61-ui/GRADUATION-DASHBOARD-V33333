#!/bin/bash
# Local zero-dependency demo: SQLite + in-process mock storage.
set -e
cd "$(dirname "$0")"

if [ ! -d backend/node_modules ]; then
  echo "Installing backend dependencies..."
  (cd backend && npm install)
fi

if [ ! -d frontend/node_modules ]; then
  echo "Installing frontend dependencies..."
  (cd frontend && npm install)
fi

echo "Applying schema and seeding demo data..."
(cd backend && npm run migrate >/dev/null && npm run seed >/dev/null)

echo "Starting API on :3001"
(cd backend && node server.js) &
BACKEND_PID=$!

cleanup() {
  echo
  echo "Stopping API (pid $BACKEND_PID)"
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting frontend on :5173"
(cd frontend && npm run dev)
