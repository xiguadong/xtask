#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DATA_REF="refs/xtask-data"

if ! git -C "$ROOT_DIR" show-ref --verify --quiet "$DATA_REF"; then
  echo "未找到 $DATA_REF，跳过清理"
  exit 0
fi

TASKS=$(git -C "$ROOT_DIR" ls-tree --name-only "$DATA_REF:tasks" 2>/dev/null || true)
if [ -z "${TASKS}" ]; then
  echo "tasks 目录为空，无需清理"
  exit 0
fi

CHANGES=()
while IFS= read -r TASK_ID; do
  [ -z "$TASK_ID" ] && continue
  if ! git -C "$ROOT_DIR" cat-file -e "$DATA_REF:tasks/${TASK_ID}/task.yaml" 2>/dev/null; then
    if git -C "$ROOT_DIR" cat-file -e "$DATA_REF:tasks/${TASK_ID}/description.md" 2>/dev/null; then
      CHANGES+=("tasks/${TASK_ID}/description.md")
    fi
  fi
done <<< "$TASKS"

if [ "${#CHANGES[@]}" -eq 0 ]; then
  echo "未发现需要清理的空任务目录"
  exit 0
fi

INDEX_FILE="$ROOT_DIR/.git/xtask-clean-index-$$"
export GIT_INDEX_FILE="$INDEX_FILE"

OLD_COMMIT=$(git -C "$ROOT_DIR" rev-parse --verify "$DATA_REF")
git -C "$ROOT_DIR" read-tree "${OLD_COMMIT}^{tree}"

for path in "${CHANGES[@]}"; do
  git -C "$ROOT_DIR" update-index --remove -- "$path" >/dev/null 2>&1 || true
done

TREE=$(git -C "$ROOT_DIR" write-tree)
NEW_COMMIT=$(git -C "$ROOT_DIR" commit-tree "$TREE" -p "$OLD_COMMIT" -m "xtask clean empty tasks")
git -C "$ROOT_DIR" update-ref "$DATA_REF" "$NEW_COMMIT" "$OLD_COMMIT"

rm -f "$INDEX_FILE"

echo "已清理空任务目录对应的残留文件："
printf '%s\n' "${CHANGES[@]}"
