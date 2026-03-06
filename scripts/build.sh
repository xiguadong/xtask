#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

ensure_dependencies() {
  local project_dir="$1"
  local project_name="$2"

  echo "Checking ${project_name} dependencies..."
  if [ ! -d "${project_dir}/node_modules" ]; then
    echo "Installing ${project_name} dependencies..."
    (cd "$project_dir" && npm install)
    return
  fi

  # node_modules 目录存在但包树可能不完整，使用 npm ls 校验后按需重装
  if ! (cd "$project_dir" && npm ls --depth=0 >/dev/null 2>&1); then
    echo "Reinstalling ${project_name} dependencies..."
    (cd "$project_dir" && npm install)
  fi
}

ensure_dependencies "backend" "backend"
ensure_dependencies "frontend" "frontend"

echo "Building frontend..."
cd frontend
npm run build

if [ $? -ne 0 ]; then
  echo "✗ Frontend build failed"
  exit 1
fi

echo "✓ Build completed"
