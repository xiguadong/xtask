#!/bin/bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
CACHE_DIR="$ROOT_DIR/cache"
TEST_DIR="$CACHE_DIR/test-cli-$$"

run_xtask() {
  if [ -d "$ROOT_DIR/cli/node_modules" ]; then
    node "$ROOT_DIR/cli/index.js" "$@"
    return
  fi

  if command -v xtask >/dev/null 2>&1; then
    xtask "$@"
    return
  fi

  echo "✗ 未找到 xtask 命令，也未检测到本地 CLI 依赖，请先安装 CLI 依赖或配置全局 xtask"
  exit 1
}

echo "=== xtask CLI 测试 ==="
echo ""

# 创建临时测试目录
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

DEFAULT_BRANCH=$(git branch --show-current)

# 测试 1: init
echo "【测试 1】xtask init"
run_xtask init
if git show-ref --verify --quiet refs/xtask-data; then
  echo "✓ Git 数据分支已创建"
else
  echo "✗ Git 数据分支未创建"
  exit 1
fi
echo ""

# 测试 1.1: skill 安装
echo "【测试 1.1】xtask init 自动安装 skills"
if [ -f "$TEST_DIR/.codex/skills/xtask-safe/SKILL.md" ] && [ -f "$TEST_DIR/.codex/skills/init-xtask/SKILL.md" ]; then
  echo "✓ 项目内置 skills 安装成功"
else
  echo "✗ 项目内置 skills 安装失败"
  exit 1
fi
echo ""

# 测试 1.2: register
echo "【测试 1.2】xtask project register"
run_xtask project register >/dev/null 2>&1 || true
echo ""

# 测试 2: milestone create
echo "【测试 2】xtask milestone create"
run_xtask milestone create "测试里程碑" --description "测试描述" --due "2026-12-31"
if git show "refs/xtask-data:milestones.yaml" | grep -q "测试里程碑"; then
  echo "✓ 里程碑创建成功"
else
  echo "✗ 里程碑创建失败"
  exit 1
fi
echo ""

# 测试 3: milestone list
echo "【测试 3】xtask milestone list"
run_xtask milestone list
echo ""

# 测试 4: task create (主分支)
echo "【测试 4】xtask task create (主分支)"
run_xtask task create "主分支任务" --milestone m1 --labels "backend,api"
TASK_ID=$(git ls-tree --name-only refs/xtask-data:tasks | head -1)
if git show "refs/xtask-data:tasks/$TASK_ID/task.yaml" >/dev/null 2>&1; then
  echo "✓ 主分支任务创建成功: $TASK_ID"
else
  echo "✗ 主分支任务创建失败"
  exit 1
fi
echo ""

# 测试 5: task list
echo "【测试 5】xtask task list"
run_xtask task list
echo ""

# 测试 6: task show
echo "【测试 6】xtask task show"
run_xtask task show "$TASK_ID"
echo ""

# 测试 7: task update
echo "【测试 7】xtask task update"
run_xtask task update "$TASK_ID" --status in_progress --priority high
if git show "refs/xtask-data:tasks/$TASK_ID/task.yaml" | grep -q "in_progress"; then
  echo "✓ 任务更新成功"
else
  echo "✗ 任务更新失败"
  exit 1
fi
echo ""

# 测试 7.1: task update summary
echo "【测试 7.1】xtask task update --summary"
run_xtask task update "$TASK_ID" --summary $'# 主分支检查\n\n- master 已支持 `summary_file`\n- 当前 CLI 已支持手工写入 summary'
if git show "refs/xtask-data:tasks/$TASK_ID/task.yaml" | grep -q "summary_file: tasks/$TASK_ID/summary.md" \
  && git show "refs/xtask-data:tasks/$TASK_ID/summary.md" | grep -q "master 已支持"; then
  echo "✓ Summary 更新成功"
else
  echo "✗ Summary 更新失败"
  exit 1
fi
echo ""

# 测试 7.1.1: task update summary file
echo "【测试 7.1.1】xtask task update --summary-file"
printf '%s\n' '# 文件总结' '' '- 这份内容来自现有 summary.md' > summary.md
run_xtask task update "$TASK_ID" --summary-file summary.md
if git show "refs/xtask-data:tasks/$TASK_ID/summary.md" | grep -q "来自现有 summary.md"; then
  echo "✓ Summary 文件同步成功"
else
  echo "✗ Summary 文件同步失败"
  exit 1
fi
echo ""

# 测试 7.2: task assign branch
echo "【测试 7.2】xtask task assign --branch"
run_xtask task assign "$TASK_ID" --branch feature-test --agent cli-sync-check
if git show "refs/xtask-data:branches/feature-test/$TASK_ID.yaml" >/dev/null 2>&1; then
  echo "✓ 主任务分支分配成功"
else
  echo "✗ 主任务分支分配失败"
  exit 1
fi

# 测试 7.3: current branch task
echo "【测试 7.3】xtask task current"
CURRENT_BRANCH_PATH="cache/worktrees/$TASK_ID"
run_xtask worktree create "$TASK_ID" --path "$CURRENT_BRANCH_PATH"
run_xtask task assign "$TASK_ID" --branch "$TASK_ID" --agent current-task-check
git checkout -b "$TASK_ID" -q
CURRENT_OUTPUT=$(run_xtask task current)
echo "$CURRENT_OUTPUT"
if printf '%s\n' "$CURRENT_OUTPUT" | grep -q "ID: $TASK_ID"; then
  echo "✓ 当前分支任务回显成功"
else
  echo "✗ 当前分支任务回显失败"
  exit 1
fi
git checkout "$DEFAULT_BRANCH" -q
echo ""

# 测试 8: worktree create
echo "【测试 8】xtask worktree create"
WORKTREE_PATH="cache/worktrees/feature-test"
run_xtask worktree create feature-test --path "$WORKTREE_PATH"
if git show "refs/xtask-data:worktrees/feature-test.yaml" >/dev/null 2>&1; then
  echo "✓ Worktree 创建成功"
else
  echo "✗ Worktree 创建失败"
  exit 1
fi
git checkout -b feature-test -q
echo ""

# 测试 9: task create (分支)
echo "【测试 9】xtask task create (分支)"
run_xtask task create "分支任务" --milestone m1 --labels "frontend"
BRANCH_TASK_ID=$(git ls-tree --name-only "refs/xtask-data:branches/feature-test" | sed 's/.yaml$//' | grep -v "^$TASK_ID$" | head -1)
if git show "refs/xtask-data:branches/feature-test/$BRANCH_TASK_ID.yaml" >/dev/null 2>&1; then
  echo "✓ 分支任务创建成功: $BRANCH_TASK_ID"
else
  echo "✗ 分支任务创建失败"
  exit 1
fi
echo ""

# 测试 10: task list (分支)
echo "【测试 10】xtask task list (分支)"
run_xtask task list
echo ""

# 测试 11: task update (分支)
echo "【测试 11】xtask task update (分支)"
run_xtask task update "$BRANCH_TASK_ID" --status done
if git show "refs/xtask-data:branches/feature-test/$BRANCH_TASK_ID.yaml" | grep -q "done"; then
  echo "✓ 分支任务更新成功"
else
  echo "✗ 分支任务更新失败"
  exit 1
fi
echo ""

# 测试 11.0: 主任务状态自动同步
echo "【测试 11.0】分支 done 自动同步主任务"
run_xtask task update "$TASK_ID" --status done
if git show "refs/xtask-data:branches/feature-test/$TASK_ID.yaml" | grep -q "status: done" \
  && git show "refs/xtask-data:tasks/$TASK_ID/task.yaml" | grep -q "status: done"; then
  echo "✓ 主任务状态自动同步成功"
else
  echo "✗ 主任务状态自动同步失败"
  exit 1
fi
echo ""

# 测试 11.1: task update summary (分支)
echo "【测试 11.1】xtask task update --summary (分支)"
run_xtask task update "$BRANCH_TASK_ID" --summary $'# 分支检查\n\n- feature-test 已支持分支任务总结'
if git show "refs/xtask-data:branches/feature-test/$BRANCH_TASK_ID.yaml" | grep -q "summary_file: tasks/$BRANCH_TASK_ID/summary.md" \
  && git show "refs/xtask-data:tasks/$BRANCH_TASK_ID/summary.md" | grep -q "feature-test 已支持"; then
  echo "✓ 分支 Summary 更新成功"
else
  echo "✗ 分支 Summary 更新失败"
  exit 1
fi
echo ""

# 测试 12: worktree list
echo "【测试 12】xtask worktree list"
run_xtask worktree list
echo ""

# 测试 13: 切换回主分支
echo "【测试 13】切换回主分支"
git checkout "$DEFAULT_BRANCH" -q
run_xtask task list
echo ""

# 测试 14: task merge
echo "【测试 14】xtask task merge"
run_xtask task merge "$BRANCH_TASK_ID" --from-branch feature-test
if git show "refs/xtask-data:tasks/$BRANCH_TASK_ID/task.yaml" >/dev/null 2>&1 && ! git show "refs/xtask-data:branches/feature-test/$BRANCH_TASK_ID.yaml" >/dev/null 2>&1; then
  echo "✓ 任务合并成功"
else
  echo "✗ 任务合并失败"
  exit 1
fi
echo ""

# 测试 15: task delete
echo "【测试 15】xtask task delete"
run_xtask task delete "$BRANCH_TASK_ID"
if git show "refs/xtask-data:tasks/$BRANCH_TASK_ID/task.yaml" >/dev/null 2>&1; then
  echo "✗ 任务删除失败"
  exit 1
else
  echo "✓ 任务删除成功"
fi
echo ""

# 测试 16: 数据结构验证
echo "【测试 16】数据结构验证"
echo "目录结构:"
git ls-tree -r --name-only refs/xtask-data | head -20
echo ""

# 测试 17: project delete-path
echo "【测试 17】xtask project delete-path"
run_xtask project delete-path "$TEST_DIR" >/dev/null 2>&1 || true
echo ""

echo "=== 所有测试通过 ✓ ==="
echo ""
echo "清理测试目录: $TEST_DIR"
cd /
rm -rf "$TEST_DIR"
