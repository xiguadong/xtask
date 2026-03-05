#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
LOG_FILE="$LOG_DIR/stop.log"
PID_FILE="$LOG_DIR/server.pid"
PORT_FILE="$LOG_DIR/server.port"
CURRENT_USER="$(id -un)"

mkdir -p "$LOG_DIR"
touch "$LOG_FILE"

log() {
  echo "[$(date '+%F %T')] $*" | tee -a "$LOG_FILE"
}

is_number() {
  [[ "${1:-}" =~ ^[0-9]+$ ]]
}

is_alive() {
  kill -0 "$1" >/dev/null 2>&1
}

pid_owner() {
  ps -o user= -p "$1" 2>/dev/null | tr -d ' '
}

cmdline_of() {
  ps -o command= -p "$1" 2>/dev/null || true
}

contains_pid() {
  local target="$1"
  shift || true
  local pid
  for pid in "$@"; do
    if [[ "$pid" == "$target" ]]; then
      return 0
    fi
  done
  return 1
}

stop_pid() {
  local pid="$1"
  local cmd
  cmd="$(cmdline_of "$pid")"
  log "stopping pid=$pid cmd=$cmd"
  kill "$pid" >/dev/null 2>&1 || true

  local i
  for i in {1..20}; do
    if ! is_alive "$pid"; then
      log "stopped pid=$pid"
      return 0
    fi
    sleep 0.2
  done

  kill -9 "$pid" >/dev/null 2>&1 || true
  if is_alive "$pid"; then
    log "failed to stop pid=$pid"
    return 1
  fi
  log "force-stopped pid=$pid"
}

TARGET_PIDS=()

log "stopping xtask processes for user: $CURRENT_USER"

# 1) 优先根据 pid 文件停止
if [[ -f "$PID_FILE" ]]; then
  PID_FROM_FILE="$(cat "$PID_FILE" 2>/dev/null || true)"
  if is_number "$PID_FROM_FILE" && is_alive "$PID_FROM_FILE" && [[ "$(pid_owner "$PID_FROM_FILE")" == "$CURRENT_USER" ]]; then
    TARGET_PIDS+=("$PID_FROM_FILE")
  fi
fi

# 2) 根据端口文件查找监听进程
if [[ -f "$PORT_FILE" ]]; then
  PORT_FROM_FILE="$(cat "$PORT_FILE" 2>/dev/null || true)"
  if is_number "$PORT_FROM_FILE"; then
    while IFS= read -r pid; do
      if is_number "$pid" && is_alive "$pid" && [[ "$(pid_owner "$pid")" == "$CURRENT_USER" ]]; then
        if ! contains_pid "$pid" "${TARGET_PIDS[@]}"; then
          TARGET_PIDS+=("$pid")
        fi
      fi
    done < <(lsof -tiTCP:"$PORT_FROM_FILE" -sTCP:LISTEN 2>/dev/null || true)
  fi
fi

# 3) 兜底：扫描当前用户下与本项目相关的后端服务
while IFS= read -r pid; do
  if ! is_number "$pid"; then
    continue
  fi
  if ! is_alive "$pid"; then
    continue
  fi
  if [[ "$(pid_owner "$pid")" != "$CURRENT_USER" ]]; then
    continue
  fi

  cmd="$(cmdline_of "$pid")"
  if [[ "$cmd" == *"$ROOT_DIR/backend/server.js"* ]] || [[ "$cmd" == *"node server.js"*"$ROOT_DIR/backend"* ]]; then
    if ! contains_pid "$pid" "${TARGET_PIDS[@]}"; then
      TARGET_PIDS+=("$pid")
    fi
  fi
done < <(pgrep -u "$CURRENT_USER" -f "node .*server.js" || true)

if [[ "${#TARGET_PIDS[@]}" -eq 0 ]]; then
  log "no xtask process found"
  rm -f "$PID_FILE" "$PORT_FILE"
  exit 0
fi

for pid in "${TARGET_PIDS[@]}"; do
  stop_pid "$pid"
done

rm -f "$PID_FILE" "$PORT_FILE"
log "stop complete: ${#TARGET_PIDS[@]} process(es) stopped"
