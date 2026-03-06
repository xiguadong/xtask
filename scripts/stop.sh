#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
LOG_FILE="$LOG_DIR/stop.log"
PID_FILE="$LOG_DIR/server.pid"
PORT_FILE="$LOG_DIR/server.port"
CURRENT_USER="$(id -un)"
BACKEND_ENTRY="$ROOT_DIR/backend/server.js"

mkdir -p "$LOG_DIR"
touch "$LOG_FILE"

log() {
  echo "[$(date '+%F %T')] $*" | tee -a "$LOG_FILE"
}

is_alive() {
  kill -0 "$1" >/dev/null 2>&1
}

cmdline_of() {
  ps -o command= -p "$1" 2>/dev/null || true
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

add_unique_pid() {
  local candidate="$1"
  local existing
  for existing in "${TARGET_PIDS[@]:-}"; do
    if [[ "$existing" == "$candidate" ]]; then
      return 0
    fi
  done
  TARGET_PIDS+=("$candidate")
}

TARGET_PIDS=()

# 首选：绝对路径启动（新版 start.sh）
while IFS= read -r pid; do
  [[ -n "${pid:-}" ]] && add_unique_pid "$pid"
done < <(pgrep -u "$CURRENT_USER" -f "$BACKEND_ENTRY" || true)

# 兼容：旧版以 `node server.js` 启动，使用 cwd 限定到当前项目 backend
if command -v lsof >/dev/null 2>&1; then
  while IFS= read -r pid; do
    [[ -z "${pid:-}" ]] && continue
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1)"
    if [[ "$cwd" == "$ROOT_DIR/backend" ]]; then
      add_unique_pid "$pid"
    fi
  done < <(pgrep -u "$CURRENT_USER" -f "node server.js" || true)
fi

if [[ "${#TARGET_PIDS[@]}" -eq 0 ]]; then
  log "no xtask process found for user=$CURRENT_USER"
  rm -f "$PID_FILE" "$PORT_FILE"
  exit 0
fi

log "found ${#TARGET_PIDS[@]} xtask process(es) for user=$CURRENT_USER"
for pid in "${TARGET_PIDS[@]}"; do
  stop_pid "$pid"
done

rm -f "$PID_FILE" "$PORT_FILE"
log "stop complete: ${#TARGET_PIDS[@]} process(es) stopped"
