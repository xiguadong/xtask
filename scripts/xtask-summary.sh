#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
DRY_RUN=false

show_help() {
	cat <<EOF
用法: xtask-summary.sh [选项]

选项:
  --help      显示此帮助信息
  --dry-run   只生成 summary.md，不调用 xtask update

说明:
  获取当前任务 → 生成 summary.md → 归档到 xtask 数据分支
EOF
}

run_xtask() {
	if [ -d "$ROOT_DIR/cli/node_modules" ]; then
		node "$ROOT_DIR/cli/index.js" "$@" 2>&1
		return
	fi

	if command -v xtask >/dev/null 2>&1; then
		xtask "$@" 2>&1
		return
	fi

	echo "✗ 未找到 xtask 命令"
	exit 1
}

# 解析参数
while [[ $# -gt 0 ]]; do
	case "$1" in
	--help)
		show_help
		exit 0
		;;
	--dry-run)
		DRY_RUN=true
		shift
		;;
	*)
		echo "未知选项: $1"
		show_help
		exit 1
		;;
	esac
done

# 检测 git 仓库
if ! git -C "$ROOT_DIR" rev-parse --git-dir >/dev/null 2>&1; then
	echo "✗ 不在 Git 仓库中"
	exit 1
fi

# 获取当前任务
TASK_OUTPUT=$(run_xtask task current 2>&1 || true)
if ! echo "$TASK_OUTPUT" | grep -q "ID:"; then
	echo "✗ 未找到当前任务"
	exit 1
fi

TASK_ID=$(echo "$TASK_OUTPUT" | grep "^ID:" | awk '{print $2}')
TASK_TITLE=$(echo "$TASK_OUTPUT" | grep "^Title:" | cut -d: -f2- | xargs)

if [ -z "$TASK_ID" ]; then
	echo "✗ 无法解析任务 ID"
	exit 1
fi

# 创建 summary.md
SUMMARY_FILE="$ROOT_DIR/xtask_todos/summary.md"
mkdir -p "$(dirname "$SUMMARY_FILE")"

{
	echo "# $TASK_TITLE"
	echo ""
	echo "**完成日期**: $(date +%Y-%m-%d)"
	echo ""
	echo "## 变更摘要"
	echo ""
	echo "\`\`\`"
	git -C "$ROOT_DIR" diff --stat "$(git -C "$ROOT_DIR" merge-base HEAD master)..HEAD" 2>/dev/null || echo "无法获取变更统计"
	echo "\`\`\`"
	echo ""

	# 如果存在 task.md，提取 Implementation Plan
	if [ -f "$ROOT_DIR/xtask_todos/task.md" ]; then
		echo "## 实现计划"
		echo ""
		if grep -q "## Implementation Plan" "$ROOT_DIR/xtask_todos/task.md"; then
			sed -n '/## Implementation Plan/,/^## /p' "$ROOT_DIR/xtask_todos/task.md" | head -n -1
		fi
	fi
} >"$SUMMARY_FILE"

if [ ! -s "$SUMMARY_FILE" ]; then
	echo "✗ 生成的 summary.md 为空"
	rm -f "$SUMMARY_FILE"
	exit 1
fi

echo "✓ 生成 summary.md: $SUMMARY_FILE"

if [ "$DRY_RUN" = true ]; then
	echo "✓ --dry-run 模式，跳过 xtask update"
	exit 0
fi

# 调用 xtask update
if run_xtask task update "$TASK_ID" --summary-file "$SUMMARY_FILE"; then
	echo "✓ 任务 $TASK_ID 已归档"
else
	echo "✗ 任务归档失败"
	exit 1
fi
