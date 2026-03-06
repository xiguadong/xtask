#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v tmux >/dev/null 2>&1; then
  echo "✗ 未检测到 tmux，请先安装 tmux"
  exit 1
fi

WORKTREE_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
GIT_COMMON_DIR="$(git -C "$WORKTREE_ROOT" rev-parse --git-common-dir 2>/dev/null || true)"
if [[ -n "${GIT_COMMON_DIR:-}" && "$GIT_COMMON_DIR" != /* ]]; then
  GIT_COMMON_DIR="$WORKTREE_ROOT/$GIT_COMMON_DIR"
fi

PROJECT_ROOT="$WORKTREE_ROOT"
if [[ -n "${GIT_COMMON_DIR:-}" && "$(basename "$GIT_COMMON_DIR")" == ".git" ]]; then
  PROJECT_ROOT="$(cd "$(dirname "$GIT_COMMON_DIR")" && pwd)"
fi

DEFAULT_TASK_KEY="$(git -C "$WORKTREE_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"
TASK_KEY="${1:-$DEFAULT_TASK_KEY}"

SESSION="$(python3 - "$PROJECT_ROOT" "$TASK_KEY" <<'PY'
import os
import sys

import yaml

project_root = os.path.abspath(sys.argv[1])
task_key = sys.argv[2]

projects_file = os.path.expanduser("~/.xtask/projects.yaml")
if not os.path.exists(projects_file):
  sys.exit(0)

with open(projects_file, "r", encoding="utf-8") as f:
  data = yaml.safe_load(f) or {}

projects = data.get("projects") or []
if not isinstance(projects, list):
  sys.exit(0)

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

if not project:
  sys.exit(0)

runtime = project.get("runtime") or {}
web_sessions = runtime.get("web_sessions") or {}
if not isinstance(web_sessions, dict):
  sys.exit(0)

entry = web_sessions.get(task_key) or {}
if not isinstance(entry, dict):
  sys.exit(0)

session = entry.get("tmux_session")
if session:
  print(str(session))
PY
)"

if [[ -z "${SESSION:-}" ]]; then
  echo "✗ 未找到记录的 tmux 会话"
  echo "  - project.path: $PROJECT_ROOT"
  echo "  - task_key: $TASK_KEY"
  echo ""
  echo "你可以手动查看：tmux ls"
  exit 1
fi

exec tmux attach -t "$SESSION"
