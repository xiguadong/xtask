#!/usr/bin/env bash
set -euo pipefail

cmd="${1:-}"
project_dir="${2:-.}"
force_overwrite=0
if [[ "${3:-}" == "--force-overwrite" ]]; then
  force_overwrite=1
fi

if [[ -z "$cmd" ]]; then
  echo "usage: $0 <inspect|init|validate|summary> <project_dir> [--force-overwrite]" >&2
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

graph_has_required_keys() {
  [[ -f "$graph_file" ]] || return 1
  for key in version project milestones labels tasks relations history; do
    rg -q "^${key}:" "$graph_file" || return 1
  done
}

rule_has_required_sections() {
  [[ -f "$rule_file" ]] || return 1
  for section in "Goal And Scope" "Source Priority" "Milestone Confirmation Rule" "Module View Rule" "Task Graph Update Rule"; do
    rg -q "$section" "$rule_file" || return 1
  done
}

is_valid_xtask() {
  graph_has_required_keys && rule_has_required_sections
}

create_or_fill_missing_files() {
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

overwrite_files_with_backup() {
  local backup_dir
  backup_dir="$abs_project_dir/.xtask.backup.$(date -u +%Y%m%dT%H%M%SZ)"
  if [[ -d "$xtask_dir" ]]; then
    cp -a "$xtask_dir" "$backup_dir"
    echo "backup created: $backup_dir"
  fi
  mkdir -p "$xtask_dir"
  render_template "$graph_tpl" > "$graph_file"
  render_template "$rule_tpl" > "$rule_file"
  echo "overwritten: $graph_file"
  echo "overwritten: $rule_file"
}

inspect_files() {
  if [[ ! -d "$xtask_dir" ]]; then
    echo "status: NEED_INIT"
    echo "reason: .xtask directory does not exist"
    echo "next: run init"
    return 0
  fi

  if [[ ! -f "$graph_file" && ! -f "$rule_file" ]]; then
    echo "status: NEED_INIT"
    echo "reason: .xtask exists but management files are missing"
    echo "next: run init"
    return 0
  fi

  if is_valid_xtask; then
    echo "status: VALID_EXISTING"
    echo "reason: existing .xtask files pass validation"
    echo "next: ask user whether to add/register current project into xtask management"
    return 0
  fi

  echo "status: INVALID_EXISTING"
  echo "reason: existing .xtask files do not satisfy required rules"
  echo "next: explicitly tell user the directory will be overwritten, then re-run init with --force-overwrite"
  return 2
}

init_files() {
  if inspect_files; then
    :
  else
    if [[ "$force_overwrite" -eq 1 ]]; then
      overwrite_files_with_backup
      return 0
    fi
    return 2
  fi

  # No files or empty directory -> create fresh files.
  if [[ ! -f "$graph_file" && ! -f "$rule_file" ]]; then
    create_or_fill_missing_files
    return 0
  fi

  # Valid existing files -> do not mutate.
  if is_valid_xtask; then
    echo "no-op: existing .xtask is valid, no overwrite performed"
    return 0
  fi

  # Partial or invalid files, force required.
  if [[ "$force_overwrite" -eq 1 ]]; then
    overwrite_files_with_backup
    return 0
  fi
  echo "blocked: invalid existing .xtask detected; run with --force-overwrite only after user approval" >&2
  return 2
}

validate_files() {
  local failed=0
  graph_has_required_keys || { echo "graph validation failed: $graph_file"; failed=1; }
  rule_has_required_sections || { echo "rule doc validation failed: $rule_file"; failed=1; }

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
  inspect)
    inspect_files
    ;;
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
