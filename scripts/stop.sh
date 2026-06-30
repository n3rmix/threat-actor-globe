#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$PROJECT_ROOT/.server.pid"
PORT="${PORT:-8787}"

stopped_any=0

# ── Kill via PID file (whole process group) ────────────────────────
if [ -f "$PID_FILE" ]; then
  PID="$(cat "$PID_FILE")"

  if kill -0 "$PID" 2>/dev/null; then
    echo "Stopping server (PID $PID) …"
    # Kill the whole process group (negative PID) so tsx children die too
    kill -TERM -- "-$PID" 2>/dev/null || kill -TERM "$PID" 2>/dev/null || true

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
      kill -KILL -- "-$PID" 2>/dev/null || kill -KILL "$PID" 2>/dev/null || true
    fi

    rm -f "$PID_FILE"
    stopped_any=1
    echo "✓ Server stopped"
  else
    echo "Server process (PID $PID) is not running. Cleaning up PID file."
    rm -f "$PID_FILE"
  fi
fi

# ── Fallback: kill anything still listening on the port ─────────────
if command -v lsof >/dev/null 2>&1; then
  PORT_PIDS="$(lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$PORT_PIDS" ]; then
    echo "Port $PORT still in use by: $PORT_PIDS — killing …"
    kill -KILL $PORT_PIDS 2>/dev/null || true
    stopped_any=1
    sleep 1
    echo "✓ Port $PORT freed"
  fi
fi

# ── Fallback: kill any leftover tsx/vite processes for this project ─
PROJECT_PIDS="$(pgrep -f "tsx .*server/index.ts" 2>/dev/null || true)"
if [ -n "$PROJECT_PIDS" ]; then
  echo "Killing leftover tsx server processes: $PROJECT_PIDS …"
  kill -KILL $PROJECT_PIDS 2>/dev/null || true
  stopped_any=1
fi

if [ "$stopped_any" -eq 0 ]; then
  echo "No server running."
fi
