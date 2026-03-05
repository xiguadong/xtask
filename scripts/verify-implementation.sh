#!/bin/bash

echo "=== 分支任务管理系统验证 ==="

# 检查文件结构
echo ""
echo "1. 检查后端文件..."
files=(
  "backend/src/services/worktreeService.js"
  "backend/src/services/branchTaskService.js"
  "backend/src/routes/worktrees.js"
  "backend/src/routes/branches.js"
  ".gitattributes"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file"
  else
    echo "✗ $file (缺失)"
  fi
done

echo ""
echo "2. 检查 CLI 命令..."
if [ -f "cli/commands/worktree.js" ]; then
  echo "✓ cli/commands/worktree.js"
else
  echo "✗ cli/commands/worktree.js (缺失)"
fi

echo ""
echo "3. 检查前端文件..."
frontend_files=(
  "frontend/src/hooks/useWorktrees.ts"
  "frontend/src/components/WorktreeCard.tsx"
  "frontend/src/components/WorktreeList.tsx"
)

for file in "${frontend_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file"
  else
    echo "✗ $file (缺失)"
  fi
done

echo ""
echo "4. 检查 Git 配置..."
if [ -f ".gitattributes" ]; then
  echo "✓ .gitattributes 已创建"
  cat .gitattributes
else
  echo "✗ .gitattributes 缺失"
fi

echo ""
echo "=== 验证完成 ==="
echo ""
echo "使用说明："
echo "1. 创建 worktree: xtask worktree create <branch> --path <path>"
echo "2. 分配任务: xtask task assign <task-id> --branch <branch>"
echo "3. 创建子任务: cd <worktree> && xtask task create '子任务' --parent <parent-id>"
echo "4. 合并任务: xtask task merge <task-id> --from-branch <branch>"
