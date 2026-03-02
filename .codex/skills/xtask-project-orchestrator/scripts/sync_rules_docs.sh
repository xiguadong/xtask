#!/usr/bin/env bash
set -euo pipefail

repo_root="${1:-.}"
rule_path="${2:-<project_dir>/.xtask/task_graph.yaml}"

if [[ ! -d "$repo_root" ]]; then
  echo "repo root not found: $repo_root" >&2
  exit 1
fi

abs_repo_root="$(cd "$repo_root" && pwd)"

START="<!-- XTASK_RULES_START -->"
END="<!-- XTASK_RULES_END -->"
read -r -d '' BLOCK <<EOB || true
$START
## xtask Sync Rules

- 新建任务与完成任务后，必须同步更新 \`$rule_path\`。
- 每次状态变化必须同步回写任务图并追加历史记录。
$END
EOB

upsert_block() {
  local file="$1"
  [[ -f "$file" ]] || return 0

  local tmp_file
  tmp_file="$(mktemp)"

  awk -v start="$START" -v end="$END" -v block="$BLOCK" '
    BEGIN {in_block=0; replaced=0}
    {
      if ($0 == start) {
        if (!replaced) {
          print block
          replaced=1
        }
        in_block=1
        next
      }
      if (in_block) {
        if ($0 == end) {
          in_block=0
        }
        next
      }
      print $0
    }
    END {
      if (!replaced) {
        if (NR > 0) print ""
        print block
      }
    }
  ' "$file" > "$tmp_file"

  mv "$tmp_file" "$file"
  echo "updated: $file"
}

upsert_block "$abs_repo_root/AGENTS.md"
upsert_block "$abs_repo_root/CLAUDE.md"
