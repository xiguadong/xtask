#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT_DIR/.cache/dev-run"
RUN_DIR="$STATE_DIR/run"
BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"

is_alive() {
  local pid="$1"
  kill -0 "$pid" >/dev/null 2>&1
}

pid_on_port() {
  local port="$1"
  lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -n 1
}

stop_pid() {
  local pid="$1"
  local name="$2"

  kill "$pid" >/dev/null 2>&1 || true
  for _ in {1..20}; do
    if ! is_alive "$pid"; then
      echo "$name stopped (pid=$pid)"
      return 0
    fi
    sleep 0.2
  done

  kill -9 "$pid" >/dev/null 2>&1 || true
  echo "$name force-stopped (pid=$pid)"
}

stop_by_pid_file() {
  local pid_file="$1"
  local name="$2"

  if [[ ! -f "$pid_file" ]]; then
    echo "$name is not running (no pid file)"
    return 0
  fi

  local pid
  pid="$(cat "$pid_file")"
  if [[ -z "$pid" ]]; then
    rm -f "$pid_file"
    echo "$name pid file was empty, cleaned."
    return 0
  fi

  if ! is_alive "$pid"; then
    rm -f "$pid_file"
    echo "$name already stopped (stale pid file removed)"
    return 0
  fi

  stop_pid "$pid" "$name"
  rm -f "$pid_file"
}

stop_by_port_fallback() {
  local port="$1"
  local name="$2"
  local pid

  pid="$(pid_on_port "$port" || true)"
  if [[ -z "${pid:-}" ]]; then
    return 0
  fi

  stop_pid "$pid" "$name (port fallback)"
}

stop_by_pid_file "$FRONTEND_PID_FILE" "Frontend"
stop_by_pid_file "$BACKEND_PID_FILE" "Backend"

# Fallback: find and stop xtask processes owned by current user
backend_pids=$(pgrep -u "$USER" -f "exe/backend" || true)
if [[ -n "$backend_pids" ]]; then
  for pid in $backend_pids; do
    if is_alive "$pid"; then
      stop_pid "$pid" "Backend (user process)"
    fi
  done
fi

vite_pids=$(pgrep -u "$USER" -f "vite.*--port.*5173" || true)
if [[ -n "$vite_pids" ]]; then
  for pid in $vite_pids; do
    if is_alive "$pid"; then
      stop_pid "$pid" "Frontend (user process)"
    fi
  done
fi

echo "Stop complete."
