#!/usr/bin/env bash
set -euo pipefail

project_dir="${1:-.}"
registry_path="${2:-${XTASK_REGISTRY:-$HOME/.xtask/projects.json}}"

if [[ ! -d "$project_dir" ]]; then
  echo "project directory not found: $project_dir" >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required to update registry json: $registry_path" >&2
  exit 1
fi

abs_project_dir="$(cd "$project_dir" && pwd)"
mkdir -p "$(dirname "$registry_path")"

python3 - "$registry_path" "$abs_project_dir" <<'PY'
import json
import os
import sys

registry_path = sys.argv[1]
project_path = sys.argv[2]

data = {"paths": []}
if os.path.exists(registry_path):
    with open(registry_path, "r", encoding="utf-8") as f:
        raw = f.read().strip()
    if raw:
        parsed = json.loads(raw)
        if not isinstance(parsed, dict):
            raise SystemExit(f"invalid registry format: {registry_path} must be a JSON object")
        paths = parsed.get("paths", [])
        if not isinstance(paths, list):
            raise SystemExit(f"invalid registry format: {registry_path}.paths must be a JSON array")
        data = {"paths": [str(p) for p in paths]}

paths = sorted(set(data["paths"] + [project_path]))
with open(registry_path, "w", encoding="utf-8") as f:
    json.dump({"paths": paths}, f, ensure_ascii=False, indent=2)
    f.write("\n")
PY

echo "registered project: $abs_project_dir"
echo "registry path: $registry_path"
