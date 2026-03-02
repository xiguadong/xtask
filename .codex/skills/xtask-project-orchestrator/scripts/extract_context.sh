#!/usr/bin/env bash
set -euo pipefail

project_dir="${1:-.}"
if [[ ! -d "$project_dir" ]]; then
  echo "project directory not found: $project_dir" >&2
  exit 1
fi

abs_project_dir="$(cd "$project_dir" && pwd)"

pick_first_existing() {
  local found=""
  for f in "$@"; do
    if [[ -f "$abs_project_dir/$f" ]]; then
      found="$abs_project_dir/$f"
      break
    fi
  done
  echo "$found"
}

readme_file="$(pick_first_existing README.md readme.md)"
plan_file="$(pick_first_existing docs/plan.md plan.md)"
task_file="$(pick_first_existing docs/task.md task.md)"

mapfile -t design_files < <(find "$abs_project_dir" -maxdepth 4 -type f \( -iname "design*.md" -o -path "*/docs/design-system/*" \) 2>/dev/null | sort)

echo "# xtask context extraction"
echo
echo "project: $abs_project_dir"
echo "timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo
echo "## selected files"
echo "- README: ${readme_file:-not found}"
echo "- PLAN: ${plan_file:-not found}"
echo "- TASK: ${task_file:-not found}"
if [[ ${#design_files[@]} -eq 0 ]]; then
  echo "- DESIGN: not found"
else
  echo "- DESIGN:"
  for f in "${design_files[@]}"; do
    echo "  - $f"
  done
fi

echo
echo "## headings preview"
for f in "$readme_file" "$plan_file" "$task_file"; do
  [[ -n "$f" && -f "$f" ]] || continue
  echo "### $(basename "$f")"
  rg -n "^#|^- \[[ xX]\]" "$f" | head -n 40 || true
  echo
 done

if [[ ${#design_files[@]} -gt 0 ]]; then
  echo "### design files headings"
  for f in "${design_files[@]}"; do
    echo "- $(basename "$f")"
    rg -n "^#" "$f" | head -n 10 || true
  done
fi
