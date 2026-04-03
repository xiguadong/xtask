# 增加xtask的skill和描述

**Status:** Done

## Original Todo

xtask工作时，现有流程，agent不会自动触发 xtask 扫描任务的workflow，需要增加 xtask-work 的skill，用于强行指定xtask的工作流程。

## Description

创建两个新的 xtask skill（xtask-work 和 xtask-summary），配套 shell 脚本实现流程自动化，部署到 .claude/skills/ 和 .codex/skills/。

核心设计原则：流程固化成 shell 脚本，SKILL.md 保持薄层（触发条件 + 调用脚本）。

_阅读 [analysis.md](./analysis.md) 以获取详细的代码库调研和上下文_

## Implementation Plan

- [x] 创建 scripts/xtask-work.sh — 工作流入口脚本
- [x] 创建 scripts/xtask-summary.sh — 归档总结脚本
- [x] 创建 .claude/skills/xtask-work/SKILL.md
- [x] 创建 .codex/skills/xtask-work/SKILL.md
- [x] 创建 .claude/skills/xtask-summary/SKILL.md
- [x] 创建 .codex/skills/xtask-summary/SKILL.md
- [x] 验证所有脚本和 SKILL.md 文件
- [x] 提交代码

## Notes

- 所有 SKILL.md 文件都在 50 行以内
- 脚本实现了幂等性和错误处理
- 脚本不直接调用 `--status done`
