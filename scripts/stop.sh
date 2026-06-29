#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$PROJECT_ROOT/.server.pid"
LOG_FILE="${LOG_FILE:-$PROJECT_ROOT/server.log}"

if [ ! -f "$PID_FILE" ]; then
  echo "No server running (PID file not found: $PID_FILE)"
  exit 0
fi

PID="$(cat "$PID_FILE")"

if kill -0 "$PID" 2>/dev/null; then
  echo "Stopping server (PID $PID) …"
  kill "$PID"

  # Wait up to 10 seconds for graceful shutdown
  for i in $(seq 1 10); do
    if ! kill -0 "$PID" 2>/dev/null; then
      break
    fi
    sleep 1
  done

  # Force kill if still running
  if kill -0 "$PID" 2>/dev/null; then
    echo "Server didn't stop gracefully, sending SIGKILL …"
    kill -9 "$PID" 2>/dev/null || true
  fi

  rm -f "$PID_FILE"
  echo "✓ Server stopped"
else
  echo "Server process (PID $PID) is not running. Cleaning up PID file."
  rm -f "$PID_FILE"
fi
