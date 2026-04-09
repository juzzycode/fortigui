#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

RUN_DIR="$ROOT_DIR/.run/edgeops"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"
LAUNCHER_PID_FILE="$RUN_DIR/launcher.pid"
RUNTIME_ENV_FILE="$RUN_DIR/runtime.env"

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

mkdir -p "$RUN_DIR"

read_pid_file() {
  local pid_file="$1"

  if [[ -f "$pid_file" ]]; then
    tr -d '[:space:]' <"$pid_file"
  fi
}

process_matches() {
  local pid="$1"
  local expected="$2"
  local args

  if [[ -z "$pid" ]] || ! kill -0 "$pid" 2>/dev/null; then
    return 1
  fi

  args="$(ps -p "$pid" -o args= 2>/dev/null || true)"
  [[ "$args" == *"$expected"* ]]
}

remove_runtime_files() {
  rm -f "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE" "$LAUNCHER_PID_FILE" "$RUNTIME_ENV_FILE"

  if [[ -d "$RUN_DIR" ]] && [[ -z "$(ls -A "$RUN_DIR" 2>/dev/null)" ]]; then
    rmdir "$RUN_DIR" 2>/dev/null || true
  fi
}

ensure_not_running() {
  local existing_backend_pid
  local existing_frontend_pid
  local existing_launcher_pid

  existing_backend_pid="$(read_pid_file "$BACKEND_PID_FILE")"
  existing_frontend_pid="$(read_pid_file "$FRONTEND_PID_FILE")"
  existing_launcher_pid="$(read_pid_file "$LAUNCHER_PID_FILE")"

  if process_matches "$existing_backend_pid" "server/index.js" \
    || process_matches "$existing_frontend_pid" "server/frontend.js" \
    || process_matches "$existing_launcher_pid" "start.sh"; then
    echo "[start] EdgeOps already appears to be running." >&2
    echo "[start] Use ./stop.sh first, or remove stale files under .run/edgeops if needed." >&2
    exit 1
  fi

  remove_runtime_files
}

write_runtime_files() {
  mkdir -p "$RUN_DIR"
  printf '%s\n' "$backend_pid" >"$BACKEND_PID_FILE"
  printf '%s\n' "$frontend_pid" >"$FRONTEND_PID_FILE"
  printf '%s\n' "$$" >"$LAUNCHER_PID_FILE"
  cat >"$RUNTIME_ENV_FILE" <<EOF
EDGEOPS_PORT=$API_PORT
EDGEOPS_FRONTEND_PORT=$FRONTEND_PORT
EDGEOPS_FRONTEND_HOST=$FRONTEND_HOST
EDGEOPS_API_ORIGIN=$EDGEOPS_API_ORIGIN
EOF
}

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
  remove_runtime_files
  exit "$exit_code"
}

trap 'cleanup $?' EXIT
trap 'cleanup 130' INT TERM

ensure_not_running

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

write_runtime_files

wait -n "$backend_pid" "$frontend_pid"
cleanup $?
