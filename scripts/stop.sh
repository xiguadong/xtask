#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
LOG_FILE="$LOG_DIR/stop.log"
CURRENT_USER="$(id -un)"

mkdir -p "$LOG_DIR"
touch "$LOG_FILE"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "[$(date '+%F %T')] stopping xtask processes for user: $CURRENT_USER"

declare -a CANDIDATE_PIDS=()
declare -a TARGET_PIDS=()
declare -A PID_SEEN=()

is_number() {
  [[ "${1:-}" =~ ^[0-9]+$ ]]
}

is_alive() {
  kill -0 "$1" >/dev/null 2>&1
}

pid_owner() {
  ps -o user= -p "$1" 2>/dev/null | tr -d ' '
}

add_candidate() {
  local pid="${1:-}"
  if ! is_number "$pid"; then
    return
  fi
  if [[ -n "${PID_SEEN[$pid]+x}" ]]; then
    return
  fi
  if ! is_alive "$pid"; then
    return
  fi
  if [[ "$(pid_owner "$pid")" != "$CURRENT_USER" ]]; then
    return
  fi
  PID_SEEN["$pid"]=1
  CANDIDATE_PIDS+=("$pid")
}

cmdline_of() {
  tr '\0' ' ' <"/proc/$1/cmdline" 2>/dev/null || true
}

cwd_of() {
  readlink -f "/proc/$1/cwd" 2>/dev/null || true
}

is_xtask_related() {
  local pid="$1"
  local cmd cwd
  cmd="$(cmdline_of "$pid")"
  cwd="$(cwd_of "$pid")"

  if [[ "$cwd" != "$ROOT_DIR"* ]] && [[ "$cmd" != *"$ROOT_DIR"* ]]; then
    return 1
  fi

  if [[ "$cwd" == "$ROOT_DIR/backend"* ]] || [[ "$cwd" == "$ROOT_DIR/frontend"* ]]; then
    return 0
  fi

  if [[ "$cmd" == *"backend/server.js"* ]] || [[ "$cmd" == *"node server.js"* ]]; then
    return 0
  fi

  if [[ "$cmd" == *"vite"* ]] || [[ "$cmd" == *"npm run dev"* ]] || [[ "$cmd" == *"pnpm dev"* ]] || [[ "$cmd" == *"yarn dev"* ]]; then
    return 0
  fi

  return 1
}

collect_candidates() {
  local pid

  while IFS= read -r pid; do
    add_candidate "$pid"
  done < <(pgrep -u "$CURRENT_USER" -f 'node .*backend/server\.js|node server\.js|vite|npm( |$).*dev|pnpm( |$).*dev|yarn( |$).*dev' || true)

  while IFS= read -r pid; do
    add_candidate "$pid"
  done < <(ss -ltnp 2>/dev/null | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u)
}

stop_pid() {
  local pid="$1"
  local cmd
  cmd="$(cmdline_of "$pid")"
  echo "stopping pid=$pid cmd=$cmd"
  kill "$pid" >/dev/null 2>&1 || true
  for _ in {1..20}; do
    if ! is_alive "$pid"; then
      echo "stopped pid=$pid"
      return 0
    fi
    sleep 0.2
  done
  kill -9 "$pid" >/dev/null 2>&1 || true
  if is_alive "$pid"; then
    echo "failed to stop pid=$pid"
    return 1
  fi
  echo "force-stopped pid=$pid"
}

collect_candidates

for pid in "${CANDIDATE_PIDS[@]}"; do
  if is_xtask_related "$pid"; then
    TARGET_PIDS+=("$pid")
  fi
done

if [[ "${#TARGET_PIDS[@]}" -eq 0 ]]; then
  echo "no xtask process found"
  rm -f "$LOG_DIR/server.pid" "$LOG_DIR/server.port"
  exit 0
fi

for pid in "${TARGET_PIDS[@]}"; do
  stop_pid "$pid"
done

rm -f "$LOG_DIR/server.pid" "$LOG_DIR/server.port"
echo "stop complete: ${#TARGET_PIDS[@]} process(es) stopped"
