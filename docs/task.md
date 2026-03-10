# 任务记录

## 2026-03-10

### xtask init 安装 skill（1773135724373-xtask-init-skill）

- [x] CLI 初始化 - `xtask init` 在创建或检测到 `refs/xtask-data` 后，同步安装 `xtask-safe` 与 `init-xtask` 到目标仓库 `.codex/skills` (2026-03-10)
- [x] 幂等补齐 - 已初始化仓库重复执行 `xtask init` 时，仍会继续补齐缺失的项目内置 skill，并跳过当前仓库同路径自拷贝 (2026-03-10)
- [x] 验证 - `scripts/test-cli.sh` 新增内置 skill 安装校验，初始化临时仓库后确认两份 skill 均已落盘 (2026-03-10)

### xtask 任务页 UI 优化（1773124373867-xtask-ui）

- [x] 任务页排序 - 排序控件移动到页面上方，支持按优先级 / 时间 / 名称切换，且都支持正序与倒序 (2026-03-10)
- [x] 标签筛选 - 左侧筛选改为彩色标签多选按钮，支持一行多枚展示与一键清空 (2026-03-10)
- [x] 标签渲染 - 任务卡片与任务详情页统一使用彩色标签徽标，提升标签辨识度 (2026-03-10)
- [x] 标签规范 - 标签导航与新增标签统一转为小写，并校正大小写混用导致的筛选/聚合不一致问题 (2026-03-10)
- [x] 状态持久化 - 任务页筛选、标签、排序、视图状态写入 URL，刷新页面与从任务详情返回时保持不丢失 (2026-03-10)
- [x] 返回体验 - 从任务详情返回项目页时固定回到任务标签页，而不是里程碑页 (2026-03-10)
- [x] 验证 - 复用主分支 `node_modules` 完成 `frontend npm run build` 与 `./scripts/start.sh 3300` 启动验证 (2026-03-10)

### 当前分支 milestone 任务修复（1773123407654-milestone）

- [x] 里程碑卡片 - 拉高卡片与滚动容器，避免下方任务状态区继续挤压目标区 (2026-03-10)
- [x] 目标列表 - 固定为 5 条可视高度并支持上下滚动，编辑态同步保持一致 (2026-03-10)
- [x] 优先级状态 - 调整为更紧凑的双列布局，减少 high / low 等状态对纵向空间的占用 (2026-03-10)
- [x] AGENTS - 补充 worktree 分支开发优先复用主分支已安装环境、不要重复安装的说明 (2026-03-10)
- [x] 验证 - `frontend npm run build` 构建通过 (2026-03-10)
- [x] 启动脚本 - `start.sh` 输出本机真实 IP，并改为仅在端口实际监听后才报告启动成功 (2026-03-10)
- [x] AGENTS - 补充 Codex 沙箱模式下可为 worktree 分支脱离沙箱执行 `./scripts/start.sh` 的说明 (2026-03-10)

### 支持删除xtask, projects（1773123760657-xtask-projects）

- [x] 首页项目卡片 - 增加“删除项目”按钮，支持直接隐藏已注册项目且保留仓库文件 (2026-03-10)
- [x] 任务详情页 - 增加“删除任务”危险操作区，确认后删除当前任务并返回项目页 (2026-03-10)
- [x] 后端接口 - 新增项目删除 API，并补齐任务删除时对分支任务记录与 worktree 任务引用的清理 (2026-03-10)
- [x] 验证 - `frontend npm run build` 构建通过，后端删除相关模块加载校验通过 (2026-03-10)

### 初始化规则补充（2026-03-10）

- [x] `init-xtask` skill - 补充初始化时同步检查 `AGENTS.md` / `CLAUDE.md`，并写入“完成任务后更新状态和写入总结”的约束 (2026-03-10)
- [x] `AGENTS.md` - 增加完成 xtask 任务后必须更新状态并写入总结的规则 (2026-03-10)
- [x] `CLAUDE.md` - 将任务完成流程修正为 `done` 状态，并补充 summary 写入要求 (2026-03-10)

## 2026-03-09

### 项目页 UI 优化（1773028025857-ui）

- [x] Project 页面 - 拆分为里程碑页 / 任务页 / Worktrees 视图，默认优先展示里程碑页 (2026-03-09)
- [x] Task 列表 - 支持按 Label / 完成状态 / Milestone 多维筛选，并支持时间与优先级状态排序 (2026-03-09)
- [x] Milestone 页面 - 展示目标清单、所属任务总进度与按优先级聚合的完成度 (2026-03-09)
- [x] Task 展示 - 任务卡片与详情页显示 `name-timestamp` 格式任务标识，并兼容 `completed` 状态 (2026-03-09)
- [x] 验证 - `frontend npm run build` 构建通过 (2026-03-09)

### 初始化 xtask Skill（1773027787026-skill）

- [x] 新增 `init-xtask` skill：聚焦 xtask 数据分支初始化、项目注册与 milestone 引导 (2026-03-09)
- [x] 补充 milestone 预设：按通用软件、遗留项目、Web、CLI 等场景给出初始化建议 (2026-03-09)
- [x] 文档更新：在 `AGENTS.md` 注册 `init-xtask` skill，并记录任务完成情况 (2026-03-09)
- [x] 状态规范 - 统一任务状态为 `todo / in_progress / done / blocked` (2026-03-09)

### README 用户文档重写（1773032186156-readme-md）

- [x] README - 按“是什么 / 为什么使用 / 怎么使用”重写为面向用户的仓库说明 (2026-03-09)
- [x] README - 校正初始化、启动、任务、worktree 等示例命令，避免旧命令误导 (2026-03-09)
- [x] README - 补充数据存储、目录结构与 Web/CLI 使用路径说明 (2026-03-09)

### 文档更新（1773036631363-refinedoc）

- [x] README - 删除 `node cli/index.js` 直调示例，统一改为 `xtask` 与脚本入口 (2026-03-09)
- [x] README - 使用方式按“安装环境 / 初始化仓库 / Web 操作”重组说明 (2026-03-09)
- [x] README - Web 服务启动与停止统一改为 `./scripts/start.sh` / `./scripts/stop.sh` (2026-03-09)
- [x] AGENTS - 补充 Codex 维护任务时必须优先使用 `xtask-safe` 且禁止直接改 YAML (2026-03-09)
- [x] Skill - 确认 `xtask-safe` 已保存在项目 `.codex/skills/xtask-safe/SKILL.md` (2026-03-09)
- [x] init-xtask - 初始化时若已有 `AGENTS.md` 则写入 `xtask-safe` 规则；若不存在需先征求用户同意再创建 (2026-03-09)

### 脚本验证链路修复（1773036415833-scripts）

- [x] CLI 测试脚本 - 临时测试仓库改到项目内 `cache/`，避免使用被禁止的 `/tmp` worktree 路径 (2026-03-09)
- [x] CLI 测试脚本 - 对齐状态枚举，分支任务更新验证从 `completed` 改为 `done` (2026-03-09)
- [x] CLI 测试脚本 - 切回初始分支时不再假定默认分支名为 `master` (2026-03-09)
- [x] 分支任务脚本 - 临时输出写入项目 `cache/`，未安装 `backend` 依赖时给出明确跳过提示 (2026-03-09)
- [x] Web Worktree 绑定 - 修复任务详情页创建 worktree 后只写入主任务 `git.branch`、未同步 `branches/<branch>/<taskId>.yaml` 与 `worktrees/<branch>.yaml.tasks` 的问题 (2026-03-09)
- [x] xtask 规则 - 新增“将任务状态改为 `done` 前必须先获得用户明确确认”约束，并同步到 AGENTS、skill 与 README (2026-03-09)
- [x] 启动脚本 - `scripts/start.sh` 改为 `nohup` 脱离终端后台常驻，关闭终端后服务仍可继续运行 (2026-03-09)
- [x] 停止脚本 - `scripts/stop.sh` 新增 `--all` / `all` 指令，扫描当前用户全部已监听端口中的 xtask 后端并全部关闭 (2026-03-09)
- [x] 脚本文档 - 更新 `scripts/README.md`，补充后台常驻与 `stop.sh --all` 用法说明 (2026-03-09)

### task.yml 增加总结字段（1773047051811-task-yml）

- [x] 任务页样式 - Summary 调整为底部独立块，并统一 Description / Summary 的紧凑排版样式 (2026-03-09)
- [x] 详情接口 - 任务详情/描述优先读取分支任务版本，修复 summary 已写入但任务页仍显示主任务旧数据 (2026-03-09)
- [x] CLI 更新 - `xtask task update` 新增 `--summary`，支持主任务与分支任务手工写入/清空 summary 文档 (2026-03-09)
- [x] 构建脚本 - 兼容复用外部 `node_modules`，前端构建改为 `vite --configLoader runner` (2026-03-09)
- [x] 任务模型 - 为 `task.yaml` 增加 `summary_file` 字段，并在 Agent 完成任务后自动写入总结文档 (2026-03-09)
- [x] 描述存储 - 长描述超过阈值时自动落盘到 `description_file`，避免 `task.yaml` 内联正文过长 (2026-03-09)
- [x] 任务页 - 在 Description 下方展示总结文档，并增加 3 分钟静态轮询刷新 (2026-03-09)
- [x] Markdown 渲染 - 修复行内代码误判为整块代码的问题，改为由 `pre` 负责块级代码容器渲染 (2026-03-09)


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
