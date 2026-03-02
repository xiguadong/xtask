#!/usr/bin/env bash
set -euo pipefail

cmd="${1:-}"
project_dir="${2:-.}"

if [[ -z "$cmd" ]]; then
  echo "usage: $0 <init|validate|summary> <project_dir>" >&2
  exit 1
fi
if [[ ! -d "$project_dir" ]]; then
  echo "project directory not found: $project_dir" >&2
  exit 1
fi

abs_project_dir="$(cd "$project_dir" && pwd)"
xtask_dir="$abs_project_dir/.xtask"
graph_file="$xtask_dir/task_graph.yaml"
rule_file="$xtask_dir/task_rule_doc.md"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
skill_dir="$(cd "$script_dir/.." && pwd)"
graph_tpl="$skill_dir/assets/task_graph.template.yaml"
rule_tpl="$skill_dir/assets/task_rule_doc.template.md"

now_utc="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
project_name="$(basename "$abs_project_dir")"
if command -v sha1sum >/dev/null 2>&1; then
  project_hash="$(printf "%s" "$abs_project_dir" | sha1sum | awk '{print $1}' | cut -c1-10)"
else
  project_hash="$(printf "%s" "$abs_project_dir" | shasum -a 1 | awk '{print $1}' | cut -c1-10)"
fi
project_id="proj-$project_hash"

render_template() {
  local src="$1"
  sed \
    -e "s#__PROJECT_ID__#$project_id#g" \
    -e "s#__PROJECT_NAME__#$project_name#g" \
    -e "s#__NOW__#$now_utc#g" \
    "$src"
}

init_files() {
  mkdir -p "$xtask_dir"

  if [[ ! -f "$graph_file" ]]; then
    render_template "$graph_tpl" > "$graph_file"
    echo "created: $graph_file"
  else
    echo "exists: $graph_file"
  fi

  if [[ ! -f "$rule_file" ]]; then
    render_template "$rule_tpl" > "$rule_file"
    echo "created: $rule_file"
  else
    echo "exists: $rule_file"
  fi
}

validate_files() {
  local failed=0
  [[ -f "$graph_file" ]] || { echo "missing: $graph_file"; failed=1; }
  [[ -f "$rule_file" ]] || { echo "missing: $rule_file"; failed=1; }

  if [[ -f "$graph_file" ]]; then
    for key in version project milestones labels tasks relations history; do
      if ! rg -q "^${key}:" "$graph_file"; then
        echo "missing key in task_graph.yaml: $key"
        failed=1
      fi
    done
  fi

  if [[ -f "$rule_file" ]]; then
    for section in "Goal And Scope" "Source Priority" "Milestone Confirmation Rule" "Module View Rule" "Task Graph Update Rule"; do
      if ! rg -q "$section" "$rule_file"; then
        echo "missing section in task_rule_doc.md: $section"
        failed=1
      fi
    done
  fi

  if [[ "$failed" -eq 0 ]]; then
    echo "validation passed"
  else
    exit 1
  fi
}

summary_files() {
  [[ -f "$graph_file" ]] || { echo "missing graph file: $graph_file"; exit 1; }

  local milestones tasks relations done blocked
  milestones="$( (rg -n '^\s*-\s*id:\s*\"?ms-' "$graph_file" || true) | wc -l | tr -d ' ' )"
  tasks="$( (rg -n '^\s*-\s*id:\s*\"?task-' "$graph_file" || true) | wc -l | tr -d ' ' )"
  relations="$( (rg -n '^\s*-\s*id:\s*\"?rel-' "$graph_file" || true) | wc -l | tr -d ' ' )"
  done="$( (rg -n 'status:\s*\"?done\"?' "$graph_file" || true) | wc -l | tr -d ' ' )"
  blocked="$( (rg -n 'status:\s*\"?blocked\"?' "$graph_file" || true) | wc -l | tr -d ' ' )"

  echo "project: $abs_project_dir"
  echo "graph: $graph_file"
  echo "milestones: $milestones"
  echo "tasks: $tasks"
  echo "relations: $relations"
  echo "done_tasks: $done"
  echo "blocked_tasks: $blocked"
}

case "$cmd" in
  init)
    init_files
    ;;
  validate)
    validate_files
    ;;
  summary)
    summary_files
    ;;
  *)
    echo "unsupported command: $cmd" >&2
    exit 1
    ;;
esac
