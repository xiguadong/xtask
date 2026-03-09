#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
LOG_FILE="$LOG_DIR/stop.log"
PID_FILE="$LOG_DIR/server.pid"
PORT_FILE="$LOG_DIR/server.port"
CURRENT_USER="$(id -un)"
BACKEND_ENTRY="$ROOT_DIR/backend/server.js"
MODE="${1:-current}"

mkdir -p "$LOG_DIR"
touch "$LOG_FILE"

log() {
  echo "[$(date '+%F %T')] $*" | tee -a "$LOG_FILE"
}

usage() {
  cat <<USAGE
用法:
  ./scripts/stop.sh           关闭当前项目的 xtask 后端进程
  ./scripts/stop.sh --all     关闭当前用户的全部 xtask 后端进程
  ./scripts/stop.sh all       同 --all
USAGE
}

is_alive() {
  kill -0 "$1" >/dev/null 2>&1
}

cmdline_of() {
  ps -o command= -p "$1" 2>/dev/null || true
}

cwd_of() {
  if ! command -v lsof >/dev/null 2>&1; then
    return 0
  fi

  lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1
}

ports_of() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -Pan -p "$1" -iTCP -sTCP:LISTEN -Fn 2>/dev/null | sed -n 's/^n.*://p' | paste -sd ',' -
    return 0
  fi

  if command -v ss >/dev/null 2>&1; then
    ss -ltnp 2>/dev/null | awk -v pid="$1" '$0 ~ ("pid=" pid ",") {split($4, parts, ":"); print parts[length(parts)]}' | paste -sd ',' -
  fi
}

stop_pid() {
  local pid="$1"
  local cmd
  local ports

  cmd="$(cmdline_of "$pid")"
  ports="$(ports_of "$pid")"
  if [[ -n "$ports" ]]; then
    log "stopping pid=$pid ports=$ports cmd=$cmd"
  else
    log "stopping pid=$pid cmd=$cmd"
  fi

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

  [[ -z "${candidate:-}" ]] && return 0
  for existing in "${TARGET_PIDS[@]:-}"; do
    if [[ "$existing" == "$candidate" ]]; then
      return 0
    fi
  done
  TARGET_PIDS+=("$candidate")
}

is_current_project_pid() {
  local pid="$1"
  local cmd
  local cwd

  cmd="$(cmdline_of "$pid")"
  [[ "$cmd" == *"$BACKEND_ENTRY"* ]] && return 0

  cwd="$(cwd_of "$pid")"
  [[ "$cmd" == *"node server.js"* && "$cwd" == "$ROOT_DIR/backend" ]]
}

is_global_xtask_pid() {
  local pid="$1"
  local cmd
  local cwd

  cmd="$(cmdline_of "$pid")"
  cwd="$(cwd_of "$pid")"

  if [[ "$cmd" == *"/backend/server.js"* && "$cmd" == *"xtask"* ]]; then
    return 0
  fi

  if [[ "$cmd" == *"node server.js"* && "$cwd" == */backend && "$cwd" == *"xtask"* ]]; then
    return 0
  fi

  return 1
}

collect_current_project_pids() {
  local pid

  while IFS= read -r pid; do
    add_unique_pid "$pid"
  done < <(pgrep -u "$CURRENT_USER" -f "$BACKEND_ENTRY" || true)

  while IFS= read -r pid; do
    [[ -z "${pid:-}" ]] && continue
    if is_current_project_pid "$pid"; then
      add_unique_pid "$pid"
    fi
  done < <(pgrep -u "$CURRENT_USER" -f "node server.js" || true)
}

collect_all_xtask_pids() {
  local pid

  while IFS= read -r pid; do
    [[ -z "${pid:-}" ]] && continue
    if is_global_xtask_pid "$pid"; then
      add_unique_pid "$pid"
    fi
  done < <(pgrep -u "$CURRENT_USER" -f "node .*server.js|node server.js" || true)
}

TARGET_PIDS=()

case "$MODE" in
  current|"")
    collect_current_project_pids
    ;;
  --all|all)
    collect_all_xtask_pids
    ;;
  -h|--help|help)
    usage
    exit 0
    ;;
  *)
    echo "未知参数: $MODE" >&2
    usage >&2
    exit 1
    ;;
esac

if [[ "${#TARGET_PIDS[@]}" -eq 0 ]]; then
  if [[ "$MODE" == "--all" || "$MODE" == "all" ]]; then
    log "no xtask process found for user=$CURRENT_USER in all ports"
  else
    log "no xtask process found for user=$CURRENT_USER in current project"
  fi
  rm -f "$PID_FILE" "$PORT_FILE"
  exit 0
fi

if [[ "$MODE" == "--all" || "$MODE" == "all" ]]; then
  log "found ${#TARGET_PIDS[@]} xtask process(es) for user=$CURRENT_USER across all ports"
else
  log "found ${#TARGET_PIDS[@]} xtask process(es) for user=$CURRENT_USER in current project"
fi

for pid in "${TARGET_PIDS[@]}"; do
  stop_pid "$pid"
done

rm -f "$PID_FILE" "$PORT_FILE"
log "stop complete: ${#TARGET_PIDS[@]} process(es) stopped"
