#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v tmux >/dev/null 2>&1; then
  echo "✗ 未检测到 tmux，请先安装 tmux"
  exit 1
fi

PORT=${1:-3000}

WORKTREE_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
GIT_COMMON_DIR="$(git -C "$WORKTREE_ROOT" rev-parse --git-common-dir 2>/dev/null || true)"
if [[ -n "${GIT_COMMON_DIR:-}" && "$GIT_COMMON_DIR" != /* ]]; then
  GIT_COMMON_DIR="$WORKTREE_ROOT/$GIT_COMMON_DIR"
fi

PROJECT_ROOT="$WORKTREE_ROOT"
if [[ -n "${GIT_COMMON_DIR:-}" && "$(basename "$GIT_COMMON_DIR")" == ".git" ]]; then
  PROJECT_ROOT="$(cd "$(dirname "$GIT_COMMON_DIR")" && pwd)"
fi

BRANCH="$(git -C "$WORKTREE_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"
TASK_KEY="$BRANCH"

sanitize_tmux_name() {
  # tmux 会话名避免空格/斜杠等特殊字符
  echo "$1" | tr '/:@ ' '----' | tr -cd '[:alnum:]._+-'
}

PROJECT_NAME_SAFE="$(sanitize_tmux_name "$(basename "$PROJECT_ROOT")")"
TASK_KEY_SAFE="$(sanitize_tmux_name "$TASK_KEY")"
SESSION="xtask-web-${PROJECT_NAME_SAFE}-${TASK_KEY_SAFE}"

if tmux has-session -t "$SESSION" >/dev/null 2>&1; then
  echo "✓ tmux 会话已存在：$SESSION"
else
  echo "创建 tmux 会话：$SESSION"
  tmux new -d -s "$SESSION" -n web -c "$WORKTREE_ROOT" "bash -lc 'set -euo pipefail; ./scripts/start.sh $PORT; echo; echo \"[xtask] Web 服务已启动（detach: Ctrl-b d）\"; exec bash'"
  tmux new-window -t "$SESSION" -n logs -c "$WORKTREE_ROOT" "bash -lc 'set -euo pipefail; mkdir -p logs; touch logs/server.log; tail -n 200 -f logs/server.log'"
fi

# 等待 start.sh 写入 logs/server.port 与 logs/server.pid（首次安装依赖可能较慢）
PORT_VALUE=""
PID_VALUE=""
for _ in $(seq 1 240); do
  if [[ -z "${PORT_VALUE:-}" && -f "$WORKTREE_ROOT/logs/server.port" ]]; then
    PORT_VALUE="$(cat "$WORKTREE_ROOT/logs/server.port" 2>/dev/null || true)"
  fi
  if [[ -z "${PID_VALUE:-}" && -f "$WORKTREE_ROOT/logs/server.pid" ]]; then
    PID_VALUE="$(cat "$WORKTREE_ROOT/logs/server.pid" 2>/dev/null || true)"
  fi
  if [[ -n "${PORT_VALUE:-}" && -n "${PID_VALUE:-}" ]]; then
    break
  fi
  sleep 0.5
done

# 记录到全局 ~/.xtask/projects.yaml：按 project.path 精确匹配，并在 runtime.web_sessions 下按 task_key 存储
python3 - "$PROJECT_ROOT" "$TASK_KEY" "$SESSION" "${PORT_VALUE:-}" "${PID_VALUE:-}" "$WORKTREE_ROOT" <<'PY'
import datetime
import os
import sys

import yaml

project_root = os.path.abspath(sys.argv[1])
task_key = sys.argv[2]
tmux_session = sys.argv[3]
port_raw = sys.argv[4].strip() if len(sys.argv) > 4 and sys.argv[4] else ""
pid_raw = sys.argv[5].strip() if len(sys.argv) > 5 and sys.argv[5] else ""
worktree_root = os.path.abspath(sys.argv[6]) if len(sys.argv) > 6 and sys.argv[6] else None

def to_int(value: str):
  try:
    return int(value)
  except Exception:
    return None

projects_file = os.path.expanduser("~/.xtask/projects.yaml")
os.makedirs(os.path.dirname(projects_file), exist_ok=True)

data = {}
if os.path.exists(projects_file):
  with open(projects_file, "r", encoding="utf-8") as f:
    data = yaml.safe_load(f) or {}

projects = data.get("projects") or []
if not isinstance(projects, list):
  projects = []

project = None
for item in projects:
  if not isinstance(item, dict):
    continue
  path_value = item.get("path")
  if not path_value:
    continue
  if os.path.abspath(str(path_value)) == project_root:
    project = item
    break

now = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

if project is None:
  project = {
    "name": os.path.basename(project_root),
    "path": project_root,
    "created_at": now,
    "hidden": False,
  }
  projects.append(project)

runtime = project.setdefault("runtime", {})
web_sessions = runtime.setdefault("web_sessions", {})
if not isinstance(web_sessions, dict):
  web_sessions = {}
  runtime["web_sessions"] = web_sessions

web_sessions[task_key] = {
  "tmux_session": tmux_session,
  "port": to_int(port_raw),
  "pid": to_int(pid_raw),
  "worktree_path": worktree_root,
  "updated_at": now,
}

data["projects"] = projects

with open(projects_file, "w", encoding="utf-8") as f:
  yaml.safe_dump(data, f, allow_unicode=True, sort_keys=False)

print(f"✓ 已写入 {projects_file}")
print(f"  - project.path: {project_root}")
print(f"  - task_key: {task_key}")
print(f"  - tmux_session: {tmux_session}")
if port_raw:
  print(f"  - port: {port_raw}")
if pid_raw:
  print(f"  - pid: {pid_raw}")
if worktree_root:
  print(f"  - worktree_path: {worktree_root}")
PY

echo ""
echo "=== 使用方式 ==="
echo "URL: ${PORT_VALUE:+http://localhost:${PORT_VALUE}}"
echo "Attach: tmux attach -t \"$SESSION\""
echo "Detach: Ctrl-b d"
echo "Stop:   ./scripts/stop.sh"
echo "Kill:   tmux kill-session -t \"$SESSION\""
