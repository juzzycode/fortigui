#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

API_PORT="${EDGEOPS_PORT:-8787}"
FRONTEND_PORT="${EDGEOPS_FRONTEND_PORT:-8080}"
FRONTEND_HOST="${EDGEOPS_FRONTEND_HOST:-0.0.0.0}"
EDGEOPS_API_ORIGIN="${EDGEOPS_API_ORIGIN:-http://127.0.0.1:${API_PORT}}"

export NODE_ENV="${NODE_ENV:-production}"
export EDGEOPS_API_ORIGIN

backend_pid=""
frontend_pid=""

cleanup() {
  local exit_code="${1:-0}"

  trap - EXIT INT TERM

  if [[ -n "$frontend_pid" ]] && kill -0 "$frontend_pid" 2>/dev/null; then
    kill "$frontend_pid" 2>/dev/null || true
  fi

  if [[ -n "$backend_pid" ]] && kill -0 "$backend_pid" 2>/dev/null; then
    kill "$backend_pid" 2>/dev/null || true
  fi

  wait 2>/dev/null || true
  exit "$exit_code"
}

trap 'cleanup $?' EXIT
trap 'cleanup 130' INT TERM

if [[ "${EDGEOPS_SKIP_BUILD:-0}" != "1" ]]; then
  echo "[start] Building frontend assets"
  npm run build
else
  echo "[start] Skipping frontend build because EDGEOPS_SKIP_BUILD=1"
fi

if [[ ! -f dist/index.html ]]; then
  echo "[start] Missing dist/index.html. Run npm run build or unset EDGEOPS_SKIP_BUILD." >&2
  exit 1
fi

echo "[start] Starting API on http://127.0.0.1:${API_PORT}"
node server/index.js &
backend_pid=$!

echo "[start] Starting frontend on http://${FRONTEND_HOST}:${FRONTEND_PORT}"
echo "[start] Frontend will proxy /api to ${EDGEOPS_API_ORIGIN}"
node server/frontend.js &
frontend_pid=$!

wait -n "$backend_pid" "$frontend_pid"
cleanup $?
