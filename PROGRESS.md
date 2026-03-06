# xtask 项目进度

## 当前版本

**v0.4.1** - 新增当前分支/worktree 任务列表命令

## 项目状态

🚧 开发中

## 已完成功能

### 核心架构
- ✅ 项目初始化和 Git 版本控制
- ✅ 基础目录结构搭建
- ✅ 文档体系建立（README.md, CLAUDE.md, PROGRESS.md）

### CLI 工具
- ✅ 项目管理命令（init, register, list, delete）
- ✅ 里程碑管理命令（create, list, update）
- ✅ 任务管理命令（create, list, show, update, assign, merge）
- ✅ Worktree 管理命令（create, list, info, delete, rename）
- ✅ Worktree 分支任务列表命令（worktree tasks）
- ✅ 分支任务自动检测和隔离存储
- ✅ 服务器启动命令

### 后端服务
- ✅ Express 服务器框架
- ✅ YAML 文件存储系统
- ✅ 项目管理 API
- ✅ 里程碑管理 API
- ✅ 任务管理 API
- ✅ Worktree 管理 API
- ✅ 分支任务管理服务
- ✅ 任务终端会话服务（本地/SSH、输入输出、超时回收、自动退出）

### 前端应用
- ✅ React + TypeScript + Tailwind CSS 框架
- ✅ 三级页面结构（项目列表、项目详情、任务详情）
- ✅ 项目卡片组件
- ✅ 里程碑列表组件
- ✅ 任务列表和任务卡片组件
- ✅ 任务详情页终端窗口（本地/SSH 启动、命令输入、输出查看、超时配置）
- ✅ 任务详情页完整交互式终端（键盘直连输入，xterm 终端视图）
- ✅ 项目主页终端总览（工作中/等待中计数 + 任务快速跳转）
- ✅ 项目主页终端上限配置（最大并发终端数）
- ✅ Terminal Overview 悬浮窗口（项目/任务页，支持放大缩小）
- ✅ 首页终端概览看板（跨项目汇总）
- ✅ 首页项目卡片内嵌 Terminal Overview（3 分钟增量刷新）
- ✅ 终端输入重复字符修复（输入去重）

### 脚本工具
- ✅ 启动脚本（start.sh）
- ✅ 停止脚本（stop.sh）
- ✅ 构建脚本（build.sh）
- ✅ tmux 启动脚本（start-tmux.sh / attach-tmux.sh，session-id 全局记录）
- ✅ CLI 测试脚本（test-cli.sh）
- ✅ 启停脚本跨平台兼容修复（macOS/Linux）
- ✅ 构建脚本依赖完整性校验（`npm ls`）
- ✅ 启动脚本端口检测增强与冲突自动重试

## 待办事项

### 短期目标
- [ ] 完成前端编译和测试
- [x] 验证 CLI 命令功能
- [ ] 测试后端 API 接口
- [ ] 编写使用文档

### 中期目标
- [x] 添加代理集成功能
- [ ] 实现任务自动执行
- [ ] 添加任务依赖关系
- [ ] 优化 Web 界面交互

### 长期目标
- [ ] 支持多用户协作
- [ ] 添加任务模板功能
- [ ] 集成 CI/CD 工具
- [ ] 支持插件系统

## 版本历史

### v0.4.1 (2026-03-06)
- CLI 新增 `xtask worktree tasks`：列出当前分支/worktree 的任务（支持可选 branch 参数与过滤条件）

### v0.4.0 (2026-03-06)
- xtask 数据从工作目录 `.xtask/` 迁移到 Git 专用分支 `refs/xtask-data`
- CLI/后端读写统一改为 Git 数据分支访问，支持多 worktree 共享
- 新增 `xtask project migrate-to-git` 迁移命令，并在迁移后移除本地 `.xtask`
- 项目内 `.xtask/` 不再生成，`~/.xtask` 仅保留全局配置与项目索引
- 修复 Git 数据写入：改用临时文件 hash-object，避免 stdin 卡住
- 读取数据分支时使用 `--quiet`，避免未初始化时的噪声输出
- 修复后端跨仓库写入：`.git` 相对路径改为基于项目目录解析
- 消除读取缺失文件的噪声日志（git show/ls-tree stderr 抑制）
- 修复后端锁文件路径：相对 `.git` 路径统一基于项目目录解析
- CLI 新增任务删除命令，并补充测试覆盖
- 新增清理脚本：自动清理 Git 数据分支中缺失 task.yaml 的残留目录
- CLI 新增按路径删除项目注册（测试清理用）
### v0.3.8 (2026-03-06)
- Terminal Overview 改为悬浮窗口，可在项目页与任务页放大/缩小
- 首页新增 Terminal Overview 看板，汇总所有项目终端会话
- 修复终端输入易重复的问题（前端输入去重）
- 修复终端输入易重复的问题（后端输入去重）

### v0.3.7 (2026-03-06)
- 重构 `stop.sh`：不再依赖 pid/port 文件作为进程发现入口，改为仅扫描“当前用户 + xtask 后端进程”并执行关闭
- `start.sh` 改为绝对路径启动后端（`node <root>/backend/server.js`），提升进程识别稳定性
- `stop.sh` 兼容旧启动方式：对 `node server.js` 增加 cwd=当前项目 backend 的限定识别

### v0.3.6 (2026-03-06)
- 修复启动失败：后端缺失 `node-pty` 依赖时，`build.sh` 现在会在 `node_modules` 已存在时继续执行 `npm ls` 校验并自动补装
- 修复 `start.sh` 端口探测盲区：优先使用 `ss` 检测监听端口，`lsof` 作为回退
- 修复 `start.sh` 端口竞争：若启动后日志出现 `EADDRINUSE`，自动递增端口重试，避免直接失败

### v0.3.5 (2026-03-06)
- Task Worktree 创建表单补齐“源分支/Worktree 分支/Worktree 路径”并增加中文标签
- Task Description 升级为 Markdown 编辑器（工具栏 + 分屏预览）并支持渲染预览
- 任务终端后端改为 PTY（修复快捷键/Tab/交互能力），并在启动时提示工作目录
- Task 编辑表单支持修改 Milestone

### v0.3.1 (2026-03-06)
- 修复 `scripts/start.sh` 的端口检测与进程记录逻辑
- 修复 `scripts/stop.sh` 的跨平台兼容问题（移除 `/proc` 和 bash4 依赖）

### v0.3.2 (2026-03-06)
- Task 页面终端改为交互式终端视图（xterm），支持键盘直接输入
- 终端模块移动至 `Task Actions` 下方
- 新增项目级终端上限配置，并在后端启动时强制限制

### v0.3.3 (2026-03-06)
- 修复任务终端键盘输入无效问题（回车符转换与输入缓冲批量发送）

### v0.3.4 (2026-03-06)
- Task 详情页 Description 支持编辑（大文本框）
- Worktree 配置调整：分支名/工作目录必填，默认目录改为 `cache/worktrees/<task-id>`，默认分支为任务 ID
- 任务终端启动前强制要求已配置 Worktree，并在 worktree 目录启动本地 Shell
- 移除 Task 子页面 Agent 相关入口，聚焦 Worktree/终端操作
- 终端窗口高度与视觉样式优化

### v0.3.0 (2026-03-05)
- 新增任务终端会话能力，支持本地 Shell 与 SSH 服务器连接
- 终端会话支持跨页面持久存在，支持手动退出
- 支持任务完成自动退出与按“无活动超时天数”自动回收
- 任务详情页新增终端配置（超时天数、自动退出）
- 项目主页新增终端工作态总览（工作中/等待中）与任务跳转

### v0.2.0 (2026-03-05)
- 修复 CLI 命令以符合数据结构文档
- 添加 worktree 管理功能（create, list, info, delete, rename）
- 实现分支任务自动检测和隔离存储
- 添加任务合并命令（task merge）
- 创建完整的 CLI 测试脚本（15 项测试）
- 完善数据结构文档和实现文档

### v0.1.0 (2026-03-05)
- 初始化项目结构
- 实现基础 CLI 工具
- 搭建后端 API 服务
- 创建前端 React 应用
- 添加启动脚本

## 技术债务

暂无

## 已知问题

暂无
