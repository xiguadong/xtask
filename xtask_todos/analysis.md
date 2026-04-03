# 代码分析

## 需求分析

需要创建两个 skill 来自动化 xtask 工作流：
1. xtask-work：获取任务信息，更新状态
2. xtask-summary：生成总结并归档

## 代码库调研

现有 skill 结构：
- .claude/skills/ 和 .codex/skills/ 两套目录
- 现有 skill：xtask-safe, xtask-todo, init-xtask, ui-ux-pro-max
- 所有现有 skill 都是纯 SKILL.md，没有配套脚本

现有脚本：
- scripts/test-cli.sh — bash 脚本风格参考
- scripts/verify-implementation.sh — 错误处理参考

## 影响范围

新增文件：
- scripts/xtask-work.sh (76行)
- scripts/xtask-summary.sh (121行)
- .claude/skills/xtask-work/SKILL.md (46行)
- .codex/skills/xtask-work/SKILL.md (38行)
- .claude/skills/xtask-summary/SKILL.md (33行)
- .codex/skills/xtask-summary/SKILL.md (39行)

## 数据流设计

xtask-work 流程：
1. 检测 git 仓库
2. 运行 xtask task current
3. 解析任务信息
4. 如果状态为 todo，更新为 in_progress
5. 创建 xtask_todos/ 目录
6. 输出任务信息

xtask-summary 流程：
1. 获取当前任务
2. 生成 summary.md（任务标题 + 日期 + git diff）
3. 调用 xtask task update --summary-file
