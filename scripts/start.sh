#!/usr/bin/env bash
set -euo pipefail

# ── Config ───────────────────────────────────────────────────────
PORT="${PORT:-8787}"
HOST="${HOST:-0.0.0.0}"
AUTO_INGEST="${AUTO_INGEST:-1}"
DB_PATH="${DB_PATH:-data/incidents.db}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$PROJECT_ROOT/.server.pid"
LOG_FILE="${LOG_FILE:-$PROJECT_ROOT/server.log}"
# ─────────────────────────────────────────────────────────────────

cd "$PROJECT_ROOT"

if [ -f "$PID_FILE" ]; then
  OLD_PID="$(cat "$PID_FILE")"
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Server is already running (PID $OLD_PID). Use 'npm run stop' first."
    exit 1
  else
    rm -f "$PID_FILE"
  fi
fi

# Build frontend if dist/ doesn't exist
if [ ! -d "dist" ]; then
  echo "Building frontend (first run)…"
  npm run build
fi

echo "Starting server on ${HOST}:${PORT} …"

PORT="$PORT" \
HOST="$HOST" \
AUTO_INGEST="$AUTO_INGEST" \
DB_PATH="$DB_PATH" \
NODE_ENV=production \
setsid npx tsx server/index.ts > "$LOG_FILE" 2>&1 &

SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

sleep 2

if kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "✓ Server started (PID $SERVER_PID)"
  echo "  Listening:  http://${HOST}:${PORT}"
  echo "  Log file:   $LOG_FILE"
  echo "  PID file:   $PID_FILE"
  echo "  Stop with:  npm run stop"
else
  echo "✗ Server failed to start. Check $LOG_FILE"
  cat "$LOG_FILE" 2>/dev/null | tail -20
  rm -f "$PID_FILE"
  exit 1
fi
