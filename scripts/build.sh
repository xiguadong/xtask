#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v make >/dev/null 2>&1; then
  echo "error: make is required" >&2
  exit 1
fi

echo "[build] frontend"
make frontend-build

echo "[build] backend"
make backend-build

echo "[build] done: $ROOT_DIR/bin/xtask"
