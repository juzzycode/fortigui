#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

RUN_DIR="$ROOT_DIR/.run/edgeops"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"
LAUNCHER_PID_FILE="$RUN_DIR/launcher.pid"
RUNTIME_ENV_FILE="$RUN_DIR/runtime.env"
FRONTEND_PROCESS_HINT=""

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

  if [[ -z "$expected" ]]; then
    [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
    return $?
  fi

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

stop_process() {
  local label="$1"
  local pid="$2"
  local expected="$3"

  if ! process_matches "$pid" "$expected"; then
    echo "[stop] ${label} is not running${pid:+ (pid ${pid} is stale)}"
    return 1
  fi

  echo "[stop] Stopping ${label} (pid ${pid})"
  kill "$pid"

  for _ in {1..40}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "[stop] ${label} stopped"
      return 0
    fi
    sleep 0.25
  done

  echo "[stop] ${label} did not exit after 10s, sending SIGKILL"
  kill -9 "$pid" 2>/dev/null || true
  return 0
}

backend_pid="$(read_pid_file "$BACKEND_PID_FILE")"
frontend_pid="$(read_pid_file "$FRONTEND_PID_FILE")"
launcher_pid="$(read_pid_file "$LAUNCHER_PID_FILE")"

if [[ ! -d "$RUN_DIR" ]]; then
  echo "[stop] No EdgeOps runtime directory found. Nothing to stop."
  exit 0
fi

if [[ -f "$RUNTIME_ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  . "$RUNTIME_ENV_FILE"
  FRONTEND_PROCESS_HINT="${EDGEOPS_FRONTEND_PROCESS_HINT:-}"
  echo "[stop] Loaded runtime state from .run/edgeops/runtime.env"
fi

stopped_any=0

if stop_process "frontend" "$frontend_pid" "$FRONTEND_PROCESS_HINT"; then
  stopped_any=1
fi

if stop_process "backend" "$backend_pid" "server/index.js"; then
  stopped_any=1
fi

if process_matches "$launcher_pid" "start.sh"; then
  echo "[stop] Signaling launcher (pid ${launcher_pid})"
  kill "$launcher_pid" 2>/dev/null || true
  stopped_any=1
fi

remove_runtime_files

if [[ "$stopped_any" -eq 0 ]]; then
  echo "[stop] No live EdgeOps processes were found. Cleared any stale runtime files."
else
  echo "[stop] EdgeOps stopped"
fi
