#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT_DIR/.cache/dev-run"
RUN_DIR="$STATE_DIR/run"
LOG_DIR="$STATE_DIR/logs"
BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

mkdir -p "$RUN_DIR" "$LOG_DIR"

is_alive() {
  local pid="$1"
  kill -0 "$pid" >/dev/null 2>&1
}

pid_on_port() {
  local port="$1"
  lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -n 1
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
  local occupied_pid

  if [[ -f "$BACKEND_PID_FILE" ]]; then
    local pid
    pid="$(cat "$BACKEND_PID_FILE")"
    if is_alive "$pid"; then
      echo "Backend already running (pid=$pid)"
      return 0
    fi
    rm -f "$BACKEND_PID_FILE"
  fi

  occupied_pid="$(pid_on_port "$BACKEND_PORT" || true)"
  if [[ -n "${occupied_pid:-}" ]]; then
    echo "ERROR: Backend port $BACKEND_PORT is already occupied (pid=$occupied_pid)." >&2
    echo "Run scripts/stop.sh first, or change BACKEND_PORT." >&2
    return 1
  fi

  (
    cd "$ROOT_DIR/backend"
    PORT="$BACKEND_PORT" GOPROXY="${GOPROXY:-https://goproxy.cn,direct}" go run . >>"$BACKEND_LOG" 2>&1 &
    echo $! >"$BACKEND_PID_FILE"
  )

  local pid
  pid="$(cat "$BACKEND_PID_FILE")"
  sleep 0.5
  if ! is_alive "$pid"; then
    rm -f "$BACKEND_PID_FILE"
    echo "ERROR: Backend exited immediately. Last logs:" >&2
    tail -n 20 "$BACKEND_LOG" >&2 || true
    return 1
  fi
  echo "Backend started (pid=$pid), log: $BACKEND_LOG"
  wait_http "http://127.0.0.1:${BACKEND_PORT}/healthz" "Backend"
}

start_frontend() {
  local occupied_pid

  if [[ -f "$FRONTEND_PID_FILE" ]]; then
    local pid
    pid="$(cat "$FRONTEND_PID_FILE")"
    if is_alive "$pid"; then
      echo "Frontend already running (pid=$pid)"
      return 0
    fi
    rm -f "$FRONTEND_PID_FILE"
  fi

  occupied_pid="$(pid_on_port "$FRONTEND_PORT" || true)"
  if [[ -n "${occupied_pid:-}" ]]; then
    echo "ERROR: Frontend port $FRONTEND_PORT is already occupied (pid=$occupied_pid)." >&2
    echo "Run scripts/stop.sh first, or change FRONTEND_PORT." >&2
    return 1
  fi

  (
    cd "$ROOT_DIR/frontend"
    npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" >>"$FRONTEND_LOG" 2>&1 &
    echo $! >"$FRONTEND_PID_FILE"
  )

  local pid
  pid="$(cat "$FRONTEND_PID_FILE")"
  sleep 0.5
  if ! is_alive "$pid"; then
    rm -f "$FRONTEND_PID_FILE"
    echo "ERROR: Frontend exited immediately. Last logs:" >&2
    tail -n 20 "$FRONTEND_LOG" >&2 || true
    return 1
  fi
  echo "Frontend started (pid=$pid), log: $FRONTEND_LOG"
  wait_http "http://127.0.0.1:${FRONTEND_PORT}" "Frontend"
}

start_backend
start_frontend

echo "All services are running."
echo "Frontend: http://127.0.0.1:${FRONTEND_PORT}"
echo "Backend:  http://127.0.0.1:${BACKEND_PORT}"
