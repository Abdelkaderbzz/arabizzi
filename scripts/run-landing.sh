#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/netlify-landing"
PORT="${PORT:-5174}"

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  PID="$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null | head -1)"
  echo ""
  echo "Port $PORT is already in use (PID ${PID:-unknown})."
  echo ""
  echo "  Landing page may already be running:"
  echo "  http://localhost:$PORT"
  echo ""
  echo "  To stop it:           kill $PID"
  echo "  Or use another port:  PORT=5175 pnpm landing"
  echo ""
  exit 1
fi

echo ""
echo "Arabizzi landing page → http://localhost:$PORT"
echo "Press Ctrl+C to stop."
echo ""

exec python3 -m http.server "$PORT" --directory "$DIR"
