#!/bin/bash

set -e

echo "=== xtask CLI 测试 ==="
echo ""

# 创建临时测试目录
TEST_DIR="/tmp/xtask-test-$$"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "测试目录: $TEST_DIR"
echo ""

# 初始化 git 仓库
git init -q
git config user.email "test@example.com"
git config user.name "Test User"
echo "# Test" > README.md
git add README.md
git commit -m "Initial commit" -q

echo "✓ Git 仓库初始化完成"
echo ""

# 测试 1: init
echo "【测试 1】xtask init"
xtask init
if [ -d ".xtask/tasks" ] && [ -d ".xtask/branches" ] && [ -d ".xtask/worktrees" ]; then
  echo "✓ 目录结构正确"
else
  echo "✗ 目录结构错误"
  exit 1
fi
echo ""

# 测试 2: milestone create
echo "【测试 2】xtask milestone create"
xtask milestone create "测试里程碑" --description "测试描述" --due "2026-12-31"
if grep -q "测试里程碑" .xtask/milestones.yaml; then
  echo "✓ 里程碑创建成功"
else
  echo "✗ 里程碑创建失败"
  exit 1
fi
echo ""

# 测试 3: milestone list
echo "【测试 3】xtask milestone list"
xtask milestone list
echo ""

# 测试 4: task create (主分支)
echo "【测试 4】xtask task create (主分支)"
xtask task create "主分支任务" --milestone m1 --labels "backend,api"
TASK_ID=$(ls .xtask/tasks/ | head -1)
if [ -f ".xtask/tasks/$TASK_ID/task.yaml" ]; then
  echo "✓ 主分支任务创建成功: $TASK_ID"
else
  echo "✗ 主分支任务创建失败"
  exit 1
fi
echo ""

# 测试 5: task list
echo "【测试 5】xtask task list"
xtask task list
echo ""

# 测试 6: task show
echo "【测试 6】xtask task show"
xtask task show "$TASK_ID"
echo ""

# 测试 7: task update
echo "【测试 7】xtask task update"
xtask task update "$TASK_ID" --status in_progress --priority high
if grep -q "in_progress" ".xtask/tasks/$TASK_ID/task.yaml"; then
  echo "✓ 任务更新成功"
else
  echo "✗ 任务更新失败"
  exit 1
fi
echo ""

# 测试 8: worktree create
echo "【测试 8】xtask worktree create"
git checkout -b feature-test -q
xtask worktree create feature-test --path "$TEST_DIR"
if [ -f ".xtask/worktrees/feature-test.yaml" ] && [ -d ".xtask/branches/feature-test" ]; then
  echo "✓ Worktree 创建成功"
else
  echo "✗ Worktree 创建失败"
  exit 1
fi
echo ""

# 测试 9: task create (分支)
echo "【测试 9】xtask task create (分支)"
xtask task create "分支任务" --milestone m1 --labels "frontend"
BRANCH_TASK_ID=$(ls .xtask/branches/feature-test/ | head -1 | sed 's/.yaml$//')
if [ -f ".xtask/branches/feature-test/$BRANCH_TASK_ID.yaml" ]; then
  echo "✓ 分支任务创建成功: $BRANCH_TASK_ID"
else
  echo "✗ 分支任务创建失败"
  exit 1
fi
echo ""

# 测试 10: task list (分支)
echo "【测试 10】xtask task list (分支)"
xtask task list
echo ""

# 测试 11: task update (分支)
echo "【测试 11】xtask task update (分支)"
xtask task update "$BRANCH_TASK_ID" --status completed
if grep -q "completed" ".xtask/branches/feature-test/$BRANCH_TASK_ID.yaml"; then
  echo "✓ 分支任务更新成功"
else
  echo "✗ 分支任务更新失败"
  exit 1
fi
echo ""

# 测试 12: worktree list
echo "【测试 12】xtask worktree list"
xtask worktree list
echo ""

# 测试 13: 切换回主分支
echo "【测试 13】切换回主分支"
git checkout master -q
xtask task list
echo ""

# 测试 14: task merge
echo "【测试 14】xtask task merge"
xtask task merge "$BRANCH_TASK_ID" --from-branch feature-test
if [ -f ".xtask/tasks/$BRANCH_TASK_ID/task.yaml" ] && [ ! -f ".xtask/branches/feature-test/$BRANCH_TASK_ID.yaml" ]; then
  echo "✓ 任务合并成功"
else
  echo "✗ 任务合并失败"
  exit 1
fi
echo ""

# 测试 15: 数据结构验证
echo "【测试 15】数据结构验证"
echo "目录结构:"
tree .xtask -L 2 2>/dev/null || find .xtask -type f -o -type d | head -20
echo ""

echo "=== 所有测试通过 ✓ ==="
echo ""
echo "清理测试目录: $TEST_DIR"
cd /
rm -rf "$TEST_DIR"
