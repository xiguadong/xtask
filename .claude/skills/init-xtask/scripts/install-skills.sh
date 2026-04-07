#!/usr/bin/env bash

set -euo pipefail

show_help() {
	cat <<EOF
用法: install-skills.sh [选项]

安装 xtask 相关 skills 到本地或全局目录

选项:
  --local              安装到项目本地目录 (.codex/skills 或 .claude/skills)
  --global             安装到全局目录 (~/.codex/skills 或 ~/.claude/skills)
  --agent codex|claude|both
                       指定目标代理 (默认: both)
  --help               显示此帮助信息

示例:
  # 安装到项目本地，仅 codex
  install-skills.sh --local --agent codex

  # 安装到全局，支持 codex 和 claude
  install-skills.sh --global --agent both

  # 显示帮助
  install-skills.sh --help
EOF
}

# 默认值
MODE=""
AGENT="both"
SKILLS=("xtask-safe" "xtask-work" "xtask-summary" "init-xtask")

# 参数解析
while [[ $# -gt 0 ]]; do
	case "$1" in
	--local)
		MODE="local"
		shift
		;;
	--global)
		MODE="global"
		shift
		;;
	--agent)
		AGENT="$2"
		shift 2
		;;
	--help)
		show_help
		exit 0
		;;
	*)
		echo "✗ 未知选项: $1" >&2
		show_help
		exit 1
		;;
	esac
done

# 验证必要参数
if [[ -z "$MODE" ]]; then
	echo "✗ 错误: 必须指定 --local 或 --global" >&2
	show_help
	exit 1
fi

if [[ ! "$AGENT" =~ ^(codex|claude|both)$ ]]; then
	echo "✗ 错误: --agent 必须是 codex、claude 或 both" >&2
	exit 1
fi

# 确定目标目录
if [[ "$MODE" == "local" ]]; then
	CODEX_TARGET=".codex/skills"
	CLAUDE_TARGET=".claude/skills"
else
	CODEX_TARGET="$HOME/.codex/skills"
	CLAUDE_TARGET="$HOME/.claude/skills"
fi

# 验证源目录存在
for skill in "${SKILLS[@]}"; do
	if [[ ! -d ".codex/skills/$skill" ]]; then
		echo "✗ 错误: 源 skill 不存在: .codex/skills/$skill" >&2
		exit 1
	fi
done

# 安装到 codex
if [[ "$AGENT" == "codex" || "$AGENT" == "both" ]]; then
	mkdir -p "$CODEX_TARGET"
	for skill in "${SKILLS[@]}"; do
		SOURCE=".codex/skills/$skill"
		TARGET="$CODEX_TARGET/$skill"
		if [[ "$(cd "$SOURCE" && pwd)" != "$(cd "$TARGET" 2>/dev/null && pwd)" ]]; then
			rm -rf "$TARGET"
			cp -r "$SOURCE" "$CODEX_TARGET/"
			echo "✓ 已安装 $skill 到 $CODEX_TARGET"
		else
			echo "✓ $skill 已在 $CODEX_TARGET (跳过)"
		fi
	done
fi

# 安装到 claude
if [[ "$AGENT" == "claude" || "$AGENT" == "both" ]]; then
	mkdir -p "$CLAUDE_TARGET"
	for skill in "${SKILLS[@]}"; do
		if [[ -d ".claude/skills/$skill" ]]; then
			SOURCE=".claude/skills/$skill"
			TARGET="$CLAUDE_TARGET/$skill"
			if [[ "$(cd "$SOURCE" && pwd)" != "$(cd "$TARGET" 2>/dev/null && pwd)" ]]; then
				rm -rf "$TARGET"
				cp -r "$SOURCE" "$CLAUDE_TARGET/"
				echo "✓ 已安装 $skill 到 $CLAUDE_TARGET"
			else
				echo "✓ $skill 已在 $CLAUDE_TARGET (跳过)"
			fi
		fi
	done
fi

echo "✓ 安装完成"
exit 0
