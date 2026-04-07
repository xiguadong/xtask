#!/usr/bin/env bash

set -euo pipefail

show_help() {
	cat <<EOF
用法: xtask-work.sh [选项]

获取当前分支任务信息，并自动更新状态为 in_progress（如果是 todo）

选项:
  --help    显示此帮助信息

示例:
  scripts/xtask-work.sh
EOF
}

if [[ "${1:-}" == "--help" ]]; then
	show_help
	exit 0
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
	echo "✗ 错误: 不在 Git 仓库中" >&2
	exit 1
fi

CURRENT_OUTPUT=$(xtask task current 2>&1) || {
	echo "✗ 错误: 无法获取当前任务" >&2
	echo "$CURRENT_OUTPUT" >&2
	exit 1
}

TASK_ID=$(echo "$CURRENT_OUTPUT" | grep "^ID: " | cut -d' ' -f2-)
TASK_TITLE=$(echo "$CURRENT_OUTPUT" | grep "^Title: " | cut -d' ' -f2-)
TASK_STATUS=$(echo "$CURRENT_OUTPUT" | grep "^Status: " | cut -d' ' -f2-)

if [[ -z "$TASK_ID" ]]; then
	echo "✗ 错误: 无法解析任务 ID" >&2
	exit 1
fi

if [[ "$TASK_STATUS" == "done" ]]; then
	echo "✗ 错误: 任务已完成 (done)" >&2
	exit 1
fi

if [[ "$TASK_STATUS" == "todo" ]]; then
	xtask task update "$TASK_ID" --status in_progress >/dev/null 2>&1 || {
		echo "✗ 错误: 无法更新任务状态" >&2
		exit 1
	}
	TASK_STATUS="in_progress"
fi

mkdir -p xtask_todos

# 初始化 task.md 模板（如果不存在）
if [ ! -f xtask_todos/task.md ]; then
	cat > xtask_todos/task.md << EOF
# $TASK_TITLE

**Status:** Refining

## Original Todo

[从任务描述提取]

## Description

[我们正在构建什么]

_阅读 [analysis.md](./analysis.md) 以获取详细的代码库调研和上下文_

## Implementation Plan

- [ ] 代码变更及位置
- [ ] 自动化测试
- [ ] 用户测试

## Notes

[实现笔记]
EOF
fi

# 初始化 analysis.md 模板（如果不存在）
if [ ! -f xtask_todos/analysis.md ]; then
	cat > xtask_todos/analysis.md << EOF
# 代码分析

## 需求分析

[需求理解和拆解]

## 代码库调研

[相关文件、函数、模式的调研结果]

## 影响范围

[变更涉及的文件和模块]

## 数据流设计

[数据流转和接口设计]
EOF
fi

TASK_DESCRIPTION=$(echo "$CURRENT_OUTPUT" | sed -n '/^--- Description ---$/,/^---/p' | tail -n +2 | head -n -1)
if [[ -z "$TASK_DESCRIPTION" ]]; then
	# 如果 description_file 存在，尝试从 git 读取
	BRANCH=$(git branch --show-current 2>/dev/null || echo "")
	if [[ -n "$BRANCH" ]] && git show "refs/xtask-data:branches/$BRANCH/$TASK_ID.yaml" >/dev/null 2>&1; then
		TASK_DESCRIPTION=$(git show "refs/xtask-data:branches/$BRANCH/$TASK_ID.yaml" | grep "^description:" | cut -d' ' -f2- | sed "s/^['\"]//;s['\"]$//")
	elif git show "refs/xtask-data:tasks/$TASK_ID/task.yaml" >/dev/null 2>&1; then
		TASK_DESCRIPTION=$(git show "refs/xtask-data:tasks/$TASK_ID/task.yaml" | grep "^description:" | cut -d' ' -f2- | sed "s/^['\"]//;s['\"]$//")
	fi
fi

TASK_MILESTONE=$(echo "$CURRENT_OUTPUT" | grep "^Milestone: " | cut -d' ' -f2-)

echo "ID: $TASK_ID"
echo "Title: $TASK_TITLE"
echo "Status: $TASK_STATUS"
if [[ -n "$TASK_MILESTONE" ]]; then
	echo "Milestone: $TASK_MILESTONE"
fi
if [[ -n "$TASK_DESCRIPTION" ]]; then
	echo "Description: $TASK_DESCRIPTION"
fi

exit 0
