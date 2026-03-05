# 任务记录

## 2026-03-06

### 任务终端交互与主页面上限配置

- [x] 前端交互 - Task 终端改为完整交互式输入（xterm） (2026-03-06)
- [x] 页面结构 - 终端移动到 Task Actions 下方 (2026-03-06)
- [x] 后端能力 - 项目级最大终端数配置与启动限制 (2026-03-06)
- [x] 前端主页 - 展示并可配置最大终端数 (2026-03-06)
- [x] 缺陷修复 - 终端键盘输入无效（回车转换与输入缓冲发送） (2026-03-06)

### 启停脚本校验与修复

- [x] 脚本校验 - start/stop 冒烟检查（接口与脚本链路） (2026-03-06)
- [x] 脚本修复 - start.sh 端口检测兼容 macOS/Linux，写入 server.pid/server.port (2026-03-06)
- [x] 脚本修复 - stop.sh 移除 Linux 专有实现，改为 pid/port 优先 + 兜底扫描 (2026-03-06)

## 2026-03-05

### 任务终端会话（1772725932588-task-ssh-agent）

- [x] 后端服务 - terminalService.js（本地/SSH 会话、输入输出、超时回收） (2026-03-05)
- [x] 后端 API - terminal 路由（start/stop/status/output/config/overview） (2026-03-05)
- [x] 后端任务流 - 任务完成自动退出终端、删除任务前退出终端 (2026-03-05)
- [x] 数据模型 - task terminal 字段默认值与旧数据兼容 (2026-03-05)
- [x] 前端页面 - TaskDetailPage 增加任务终端窗口与配置 (2026-03-05)
- [x] 前端页面 - ProjectDetailPage 增加工作中/等待中终端汇总与跳转 (2026-03-05)
- [x] 前端 Hook/API - useTerminal 与终端接口封装 (2026-03-05)
- [x] CLI 对齐 - 任务默认结构补充 terminal 字段 (2026-03-05)

### 分支任务管理架构实现

- [x] 后端数据层 - worktreeService.js (2026-03-05)
- [x] 后端数据层 - branchTaskService.js (2026-03-05)
- [x] 后端数据层 - taskService.js 增强 (2026-03-05)
- [x] 后端 API - worktrees 路由 (2026-03-05)
- [x] 后端 API - branches 路由 (2026-03-05)
- [x] 后端 API - tasks 路由增强 (2026-03-05)
- [x] CLI 工具 - worktree 命令 (2026-03-05)
- [x] CLI 工具 - task 命令增强 (2026-03-05)
- [x] 前端类型 - Worktree 接口 (2026-03-05)
- [x] 前端 Hook - useWorktrees (2026-03-05)
- [x] 前端组件 - WorktreeCard (2026-03-05)
- [x] 前端组件 - WorktreeList (2026-03-05)
- [x] 前端组件 - TaskCard 增强 (2026-03-05)
- [x] 前端页面 - ProjectDetailPage 增强 (2026-03-05)
- [x] Git 配置 - .gitattributes (2026-03-05)
- [x] 文档 - 实现文档 (2026-03-05)
- [x] 脚本 - 验证脚本 (2026-03-05)

### 项目结构规范化

- [x] 移动脚本到 scripts/ 目录 (2026-03-05)
- [x] 移动文档到 docs/ 目录 (2026-03-05)
- [x] 更新 CLAUDE.md 添加结构约束 (2026-03-05)
- [x] 创建 docs/task.md 任务追踪文档 (2026-03-05)
