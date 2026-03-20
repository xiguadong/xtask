# xtask 项目描述

## 概述
xtask 是一个基于文件的本地项目管理系统，用于跟踪任务、里程碑和代理分配。

## 技术栈
- **CLI**: Node.js + Commander.js
- **后端**: Express.js + YAML 文件存储
- **前端**: React 18 + TypeScript + Tailwind CSS + Vite
- **数据存储**: Git orphan 分支 (`refs/xtask-data`) + YAML 文件

## 架构
- CLI 和后端共享 `gitDataStore` 工具，通过 Git 数据分支读写任务/里程碑/工作树数据
- 前端通过 REST API 与后端通信
- 任务以 YAML 格式存储，描述和摘要使用 Markdown 文件
- 工作树(worktree)机制支持多分支并行开发

## 关键目录
- `cli/` - CLI 工具（Commander.js 命令）
- `backend/` - Express API 服务
- `frontend/` - React 前端应用
- `scripts/` - 启动/停止/构建脚本
- `.claude/skills/` - Claude 技能定义
- `.codex/skills/` - Codex 技能定义

## 测试
- `scripts/test-cli.sh` - CLI 集成测试
- `scripts/test-branch-tasks.sh` - 分支任务测试

## 入口点
- CLI: `cli/index.js`
- 后端: `backend/server.js`
- 前端: `frontend/src/main.tsx`
