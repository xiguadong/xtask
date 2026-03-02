#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT_DIR/.cache/dev-run"
RUN_DIR="$STATE_DIR/run"
LOG_DIR="$STATE_DIR/logs"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

mkdir -p "$RUN_DIR" "$LOG_DIR"

is_alive() {
  local pid="$1"
  kill -0 "$pid" >/dev/null 2>&1
}

wait_http() {
  local url="$1"
  local name="$2"
  local max_retry=60

  for ((i = 1; i <= max_retry; i++)); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$name is ready: $url"
      return 0
    fi
    sleep 0.5
  done

  echo "ERROR: $name failed to become ready: $url" >&2
  return 1
}

start_backend() {
  if [[ -f "$BACKEND_PID_FILE" ]]; then
    local pid
    pid="$(cat "$BACKEND_PID_FILE")"
    if is_alive "$pid"; then
      echo "Backend already running (pid=$pid)"
      return 0
    fi
    rm -f "$BACKEND_PID_FILE"
  fi

  (
    cd "$ROOT_DIR/backend"
    GOPROXY="${GOPROXY:-https://goproxy.cn,direct}" go run . >>"$BACKEND_LOG" 2>&1 &
    echo $! >"$BACKEND_PID_FILE"
  )

  local pid
  pid="$(cat "$BACKEND_PID_FILE")"
  echo "Backend started (pid=$pid), log: $BACKEND_LOG"
  wait_http "http://127.0.0.1:8080/healthz" "Backend"
}

start_frontend() {
  if [[ -f "$FRONTEND_PID_FILE" ]]; then
    local pid
    pid="$(cat "$FRONTEND_PID_FILE")"
    if is_alive "$pid"; then
      echo "Frontend already running (pid=$pid)"
      return 0
    fi
    rm -f "$FRONTEND_PID_FILE"
  fi

  (
    cd "$ROOT_DIR/frontend"
    npm run dev -- --host 127.0.0.1 --port 5173 >>"$FRONTEND_LOG" 2>&1 &
    echo $! >"$FRONTEND_PID_FILE"
  )

  local pid
  pid="$(cat "$FRONTEND_PID_FILE")"
  echo "Frontend started (pid=$pid), log: $FRONTEND_LOG"
  wait_http "http://127.0.0.1:5173" "Frontend"
}

start_backend
start_frontend

echo "All services are running."
echo "Frontend: http://127.0.0.1:5173"
echo "Backend:  http://127.0.0.1:8080"
