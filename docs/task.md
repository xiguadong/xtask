# 任务记录

## 2026-03-09

### 项目页 UI 优化（1773028025857-ui）

- [x] Project 页面 - 拆分为里程碑页 / 任务页 / Worktrees 视图，默认优先展示里程碑页 (2026-03-09)
- [x] Task 列表 - 支持按 Label / 完成状态 / Milestone 多维筛选，并支持时间与优先级状态排序 (2026-03-09)
- [x] Milestone 页面 - 展示目标清单、所属任务总进度与按优先级聚合的完成度 (2026-03-09)
- [x] Task 展示 - 任务卡片与详情页显示 `name-timestamp` 格式任务标识，并兼容 `completed` 状态 (2026-03-09)
- [x] 验证 - `frontend npm run build` 构建通过 (2026-03-09)


## 2026-03-06

### Git 数据分支存储重构

- [x] 数据存储 - xtask 数据迁移到 Git 专用分支 `refs/xtask-data` (2026-03-06)
- [x] CLI 改造 - 任务/里程碑/Worktree 读写改为 Git 数据分支 (2026-03-06)
- [x] 后端改造 - 任务/里程碑/Worktree/终端/Agent 读写改为 Git 数据分支 (2026-03-06)
- [x] 迁移命令 - 新增 `xtask project migrate-to-git` (2026-03-06)
- [x] 修复写入 - Git hash-object 改用临时文件，避免 stdin 卡住 (2026-03-06)
- [x] 修复后端写入 - `.git` 相对路径改为基于项目目录解析 (2026-03-06)
- [x] 修复日志 - 读取缺失文件时不再输出 git fatal 噪声 (2026-03-06)
- [x] 修复锁路径 - 后端 `.git` 相对路径基于项目目录解析 (2026-03-06)
- [x] CLI 删除 - 新增 `xtask task delete` 并补测试 (2026-03-06)
- [x] 清理脚本 - `cleanup-empty-tasks.sh` 清理缺失 task.yaml 的残留目录 (2026-03-06)
- [x] CLI 清理 - 新增 `xtask project delete-path` 便于测试后移除注册 (2026-03-06)

### CLI 命令增强

- [x] Worktree 任务列表 - 新增 `xtask worktree tasks` 列出当前分支/worktree 的任务 (2026-03-06)

### 启动链路稳定性修复

- [x] 依赖修复 - 补装 `backend` 缺失依赖 `node-pty`，修复后端启动 `ERR_MODULE_NOT_FOUND` (2026-03-06)
- [x] 脚本修复 - `build.sh` 增加 `npm ls` 依赖完整性校验，避免仅判断 `node_modules` 目录导致漏装 (2026-03-06)
- [x] 脚本修复 - `start.sh` 端口检测优先使用 `ss`，并在 `EADDRINUSE` 时自动递增端口重试 (2026-03-06)
- [x] 脚本重构 - `stop.sh` 改为仅基于“当前用户 + xtask 进程”扫描并关闭，不再以 pid/port 文件做发现入口 (2026-03-06)
- [x] 脚本兼容 - `start.sh` 改为绝对路径启动，`stop.sh` 兼容旧 `node server.js` 启动方式（cwd 限定） (2026-03-06)

### 任务终端交互与主页面上限配置

- [x] 前端交互 - Task 终端改为完整交互式输入（xterm） (2026-03-06)
- [x] 页面结构 - 终端移动到 Task Actions 下方 (2026-03-06)
- [x] 后端能力 - 项目级最大终端数配置与启动限制 (2026-03-06)
- [x] 前端主页 - 展示并可配置最大终端数 (2026-03-06)
- [x] 缺陷修复 - 终端键盘输入无效（回车转换与输入缓冲发送） (2026-03-06)

### Terminal Overview 悬浮窗口与看板

- [x] Project/Task 页面 - Terminal Overview 改为悬浮窗口，支持放大缩小 (2026-03-06)
- [x] 首页看板 - 展示所有项目的 Terminal Overview (2026-03-06)
- [x] 首页看板 - Terminal Overview 下沉到项目卡片，3 分钟自动刷新并按项目增量更新 (2026-03-06)
- [x] 缺陷修复 - 终端输入重复字符（前端输入去重） (2026-03-06)
- [x] 缺陷修复 - 终端输入重复字符（后端输入去重） (2026-03-06)

### 启停脚本校验与修复

- [x] 脚本校验 - start/stop 冒烟检查（接口与脚本链路） (2026-03-06)
- [x] 脚本修复 - start.sh 端口检测兼容 macOS/Linux，写入 server.pid/server.port (2026-03-06)
- [x] 脚本修复 - stop.sh 移除 Linux 专有实现，改为 pid/port 优先 + 兜底扫描 (2026-03-06)
- [x] 脚本增强 - start-tmux/attach-tmux：Web 以 tmux 会话常驻，并将 session-id 写入 `~/.xtask/projects.yaml` (2026-03-06)

### Task 详情页 UI 改善（1772729825689-ui）

- [x] Task 详情页 - Description 支持编辑（大文本框） (2026-03-06)
- [x] Task 详情页 - 移除 Agent 相关入口（Assignment/启动停止） (2026-03-06)
- [x] Worktree - 分支名/工作目录必填，默认分支=task-id，默认目录=cache/worktrees/<task-id> (2026-03-06)
- [x] Terminal - 启动前强制要求已配置 Worktree，并在 worktree 目录启动本地 Shell (2026-03-06)
- [x] Terminal UI - 终端窗口加高并优化观感 (2026-03-06)

### Task 页面 UI 继续修复（1772736104102-ui）

- [x] Worktree - 新增“从哪个分支创建 / Worktree 分支 / Worktree 路径”三字段与中文标签 (2026-03-06)
- [x] Description - Markdown 编辑器（工具栏 + 分屏预览）与渲染预览 (2026-03-06)
- [x] Worktree/Terminal - 创建 Worktree 使用 `git worktree add -b`，终端在 Worktree 目录启动 (2026-03-06)
- [x] Terminal UI - 后端改为 PTY，支持 Tab/Ctrl/Shift 快捷键并优化主题 (2026-03-06)
- [x] Task 编辑 - 支持修改 Milestone (2026-03-06)
- [x] 测试 - `frontend` 构建通过 + 终端 PTY 冒烟（启动->pwd->停止）通过 (2026-03-06)

### Terminal 修改（1772786490728-terminal）

- [x] Terminal 保活 - 创建后会话在后端持续运行，跨页面可继续使用 (2026-03-06)
- [x] Terminal 输入去重 - 前端/后端输入去重与合并，避免重复字符 (2026-03-06)
- [x] Terminal 输出去重 - 输出拉取改为串行轮询，避免网络抖动导致重复渲染 (2026-03-06)

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
