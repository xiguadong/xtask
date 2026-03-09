#!/bin/bash

set -u

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
CACHE_DIR="$ROOT_DIR/cache"

if [ ! -d "$ROOT_DIR/backend/node_modules" ]; then
  echo "=== 测试分支任务管理功能 ==="
  echo "跳过：未检测到 backend 依赖，请先在 backend 目录执行 npm install"
  exit 0
fi

echo "=== 测试分支任务管理功能 ==="

# 1. 测试创建 worktree
echo "1. 测试创建 worktree..."
node -e "
import { createWorktree } from './backend/src/services/worktreeService.js';
const wt = createWorktree('.', 'feature/test', 'cache/worktrees/test-wt', { identity: 'claude', model: 'opus-4' });
console.log('✓ Worktree created:', wt.branch);
"

# 2. 测试创建任务
echo "2. 测试创建任务..."
node -e "
import { createTask } from './backend/src/services/taskService.js';
const task = createTask('.', { title: '测试任务', description: '这是一个测试' });
console.log('✓ Task created:', task.id);
" > "$CACHE_DIR/test-branch-task-id.txt"

# 3. 验证数据分支结构
echo "3. 验证数据分支结构..."
git ls-tree --name-only refs/xtask-data:worktrees
git ls-tree --name-only refs/xtask-data:tasks

echo "=== 测试完成 ==="
