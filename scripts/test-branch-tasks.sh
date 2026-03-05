#!/bin/bash

echo "=== 测试分支任务管理功能 ==="

# 1. 创建测试目录结构
echo "1. 创建测试目录结构..."
mkdir -p .xtask/tasks
mkdir -p .xtask/branches
mkdir -p .xtask/worktrees

# 2. 测试创建 worktree
echo "2. 测试创建 worktree..."
node -e "
import { createWorktree } from './backend/src/services/worktreeService.js';
const wt = createWorktree('.', 'feature/test', '/tmp/test-wt', { identity: 'claude', model: 'opus-4' });
console.log('✓ Worktree created:', wt.branch);
"

# 3. 测试创建任务
echo "3. 测试创建任务..."
node -e "
import { createTask } from './backend/src/services/taskService.js';
const task = createTask('.', { title: '测试任务', description: '这是一个测试' });
console.log('✓ Task created:', task.id);
" > /tmp/task_id.txt

# 4. 验证文件结构
echo "4. 验证文件结构..."
ls -la .xtask/worktrees/
ls -la .xtask/branches/

echo "=== 测试完成 ==="
