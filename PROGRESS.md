# xtask 项目进度

## 当前版本

**v0.4.8** - 分支任务标记 `done` 时自动同步主任务状态，补齐 Web/CLI 一致性与测试覆盖

## 项目状态

🚧 开发中

## 2026-03-10

- ✅ 分支任务在 Web/CLI 中被标记为 `done` 时，会自动把主任务 `tasks/<id>/task.yaml` 的状态同步为 `done`
- ✅ Agent 在分支任务上执行完成后，也会同步回写主任务完成状态，避免详情页/看板再次分裂
- ✅ `scripts/test-cli.sh` 新增“分支 done 自动同步主任务”校验，覆盖 CLI 路径

- ✅ 任务列表接口改为优先返回分支任务副本，修复任务详情已改成 `done` 但项目页看板仍按主任务 `todo` 统计为未完成的问题
- ✅ 前端任务状态枚举收敛为 `todo / in_progress / done / blocked`，兼容历史 `completed` 数据时统一按 `done` 展示与排序
- ✅ 任务详情编辑页移除重复的 `completed` 状态选项，避免与 `done` 并存造成混淆

- ✅ `xtask init` 自动把 `xtask-safe` 与 `init-xtask` 安装到目标仓库的 `.codex/skills/`
- ✅ `xtask init` 改为幂等补齐：即使 `refs/xtask-data` 已存在，也会继续同步缺失的项目内置 skills
- ✅ CLI 测试脚本新增 skill 安装校验，初始化临时仓库后会检查两份内置 skill 是否已落到目标目录

- ✅ `start.sh` 输出访问地址时改用本机真实 IP，不再固定打印 `localhost`
- ✅ `start.sh` 启动成功判定改为“端口已实际监听”，避免后台进程短暂存活导致误报成功
- ✅ `AGENTS.md` 补充说明：Codex 沙箱模式下，允许为 worktree 分支脱离沙箱执行 `./scripts/start.sh`
- ✅ 里程碑页卡片加高，目标区固定为 5 条可视高度并支持上下滚动，避免下方任务状态区挤压目标列表
- ✅ 里程碑页的优先级任务状态改为更紧凑的双列布局，减少 high / low 多档状态造成的纵向拥挤
- ✅ `AGENTS.md` 补充约束：开发 worktree 分支时优先复用主分支已安装环境，不在 worktree 中重复安装依赖
- ✅ `frontend npm run build` 构建通过（保留 Vite 大包体积告警，不影响本次功能修复）

- ✅ 首页项目卡片增加“删除项目”按钮，支持直接隐藏已注册项目，无需回到 CLI
- ✅ 任务详情页增加“删除任务”危险操作区，确认后删除任务并返回所属项目页
- ✅ 后端新增项目删除 API，复用 `projects.yaml` 的 `hidden` 语义而非删除仓库文件
- ✅ 任务删除逻辑补齐关联清理：同步移除 `branches/<branch>/<task>.yaml` 与 `worktrees/<branch>.yaml.tasks` 中的引用
- ✅ 完成验证：`frontend` 执行 `npm run build` 通过，后端删除相关模块加载校验通过
- ✅ `init-xtask` skill 补充初始化规则：同步检查 `AGENTS.md` / `CLAUDE.md`，并写入“完成任务后更新状态和写入总结”的要求
- ✅ `AGENTS.md` / `CLAUDE.md` 已补齐任务完成规范：更新状态统一为 `done` 流程，并要求写入任务总结

- ✅ 任务页排序控件上移到页面顶部，不再占用左侧筛选区；支持按优先级、创建时间、任务名称切换，并可选正序/倒序
- ✅ 左侧标签筛选改为彩色多选徽标，支持一行多枚展示与一键清空；筛选逻辑为命中任一已选标签即可展示
- ✅ 任务卡片与任务详情页共用彩色标签徽标组件，保证筛选标签与渲染标签视觉一致
- ✅ 标签导航、任务详情新增标签、后端/CLI 标签写入统一归一为小写；扫描 `refs/xtask-data` 后确认当前项目无额外历史大写标签需要回写
- ✅ 任务页视图、筛选、标签与排序状态同步到 URL；浏览器刷新页面、进入任务详情再返回时可恢复原有筛选上下文
- ✅ 项目详情视图状态同步到 URL 查询参数，任务详情返回项目页时固定回到 `?view=tasks`
- ✅ 复用主分支依赖环境完成 `frontend npm run build` 验证，并执行 `./scripts/start.sh 3300` 启动测试

## 2026-03-09

- ✅ 任务详情接口优先读取分支任务版本，修复分支任务已有 `summary_file`/`summary_content` 但页面仍显示主任务旧数据的问题
- ✅ `build.sh` 兼容共享依赖目录：前端构建改用 `vite --configLoader runner`，避免复用外部 `node_modules` 时写 `.vite-temp` 失败
- ✅ `task.yaml` 新增 `summary_file` 字段，Agent 完成任务后自动写入 `tasks/<id>/summary.md`
- ✅ `xtask task update` 新增 `--summary`，支持主任务与分支任务手工写入/清空总结文档
- ✅ 长描述自动切换为文件存储：超过阈值时写入 `description_file`，详情页读取完整内容，卡片保留摘要预览
- ✅ Task 详情页支持展示总结文档，并增加 3 分钟静态轮询刷新以感知 Agent 新写入的总结
- ✅ 修复 Markdown 行内代码渲染：避免单个反引号词组被误显示为整块深色代码块

## 已完成功能

### Codex Skills
- ✅ 新增 `init-xtask` skill（初始化 `refs/xtask-data`、注册项目、引导首批 milestone）
- ✅ 新增 xtask 初始化 milestone 预设，支持通用软件 / 遗留项目 / Web / CLI 场景
- ✅ 统一任务状态枚举为 `todo / in_progress / done / blocked`
- ✅ `init-xtask` 增补 `AGENTS.md` 处理流程（已有则补规则，无则先征求用户同意）

### 文档与指引
- ✅ 重写 `README.md`，按“是什么 / 为什么使用 / 怎么使用”面向用户组织内容
- ✅ 补充初始化、启动、任务、worktree、数据存储与目录结构说明
- ✅ README 二次细化为“安装环境 / 初始化仓库 / Web 操作”结构
- ✅ AGENTS 补充 Codex 任务维护约束与 `xtask-safe` 使用说明

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
- ✅ 项目页拆分为里程碑 / 任务 / Worktrees 三个视图
- ✅ 任务列表多维筛选（Label / 完成状态 / Milestone）与排序
- ✅ 里程碑页聚合任务进度（总进度 + 按优先级进度）
- ✅ 任务展示 `name-timestamp` 标识与 `completed` 状态兼容
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
- ✅ 启动脚本后台常驻（脱离终端）
- ✅ 停止脚本 `--all` 全量扫描并关闭当前用户 xtask 进程

## 待办事项

### 短期目标
- [ ] 完成前端编译和测试
- [x] 验证 CLI 命令功能
- [ ] 测试后端 API 接口
- [x] 编写使用文档

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

### v0.4.8 (2026-03-10)
- 分支任务在 Web/CLI 标记为 `done` 时，自动把主任务状态同步为 `done`
- Agent 完成分支任务后同步回写主任务完成状态，减少主/分支状态分裂
- CLI 测试补齐分支任务完成后主任务状态同步校验

### v0.4.7 (2026-03-10)
- 任务列表接口优先读取分支任务副本，修复任务详情页与项目任务看板状态不一致的问题
- 前端任务状态统一收敛到 `done` 完成态，并兼容历史 `completed` 数据展示
- 任务详情编辑页移除重复的 `completed` 选项，避免与 `done` 重复

### v0.4.6 (2026-03-10)
- 任务页排序控件上移至顶部，支持按优先级 / 创建时间 / 名称的正序与倒序切换
- 左侧标签筛选改为彩色多选，任务卡片与详情页统一使用彩色标签徽标
- 任务页筛选与排序状态写入 URL，任务详情返回项目页时默认回到任务视图并保留上下文

### v0.4.5 (2026-03-10)
- 首页项目卡片支持直接删除（隐藏）项目，任务详情页支持删除任务
- 后端新增项目删除 API，并在删除任务时同步清理分支任务记录与 worktree 任务引用
- `init-xtask` skill、`AGENTS.md`、`CLAUDE.md` 补齐任务完成后更新状态与写入总结的规范

### v0.4.4 (2026-03-10)
- `start.sh` 输出访问地址时改用本机真实 IP，便于局域网或宿主机直接访问
- `start.sh` 成功判定改为等待端口实际监听，避免仅凭 PID 存活造成“假启动成功”
- `AGENTS.md` 补充 Codex 沙箱例外：在 worktree 分支验证服务时，允许对 `./scripts/start.sh` 申请脱离沙箱执行

### v0.4.3 (2026-03-10)
- 优化里程碑页卡片布局：增大卡片与容器高度，避免下方任务状态区域持续压缩目标列表
- 目标列表固定展示 5 条可视高度，超出后改为纵向滚动，编辑态同步保持一致
- 里程碑任务状态改为紧凑双列展示，降低 high / medium / low 多优先级场景下的占位
- `AGENTS.md` 补充 worktree 开发约束：优先复用主分支已安装环境，不在 worktree 中重复安装
- `frontend npm run build` 构建通过；当前仅保留 Vite 默认的大包体积告警

### v0.4.2 (2026-03-09)
- 项目页拆分为里程碑页、任务页与 Worktrees 视图，默认优先展示里程碑页
- 任务列表新增 Label / 完成状态 / Milestone 多维筛选与时间、优先级状态排序
- 里程碑卡片新增所属任务总进度与按优先级聚合的完成进度展示
- 任务卡片与详情页显示 `name-timestamp` 任务标识，并兼容 `completed` 状态显示
- `xtask task update` 新增 `--summary`，支持主任务与分支任务手工写入总结文档
- `frontend` 构建验证通过
- 新增 `init-xtask` skill：支持初始化 `refs/xtask-data`、注册项目并引导首批 milestone
- 新增 xtask 初始化 milestone 预设，覆盖通用软件、遗留项目、Web、CLI 场景
- 统一任务状态枚举为 `todo / in_progress / done / blocked`
- 重写 `README.md`，面向用户说明 xtask 是什么、为什么使用以及如何开始
- README 改为“安装环境 / 初始化仓库 / Web 操作”三段式结构，并统一使用 `xtask` 与脚本入口示例
- AGENTS 补充 Codex 任务维护约束，`init-xtask` skill 增补 `AGENTS.md` 处理流程
- 修复 `scripts/test-cli.sh`：改用项目内 `cache/` 临时目录，兼容 `done` 状态与非 `master` 默认分支
- 修复 `scripts/test-branch-tasks.sh`：移除 `/tmp` 临时文件依赖，缺少 `backend` 依赖时改为明确提示并跳过
- 修复 Web 端创建 worktree 后仅更新主任务 `git.branch`、未同步分支任务文件和 worktree `tasks` 列表的问题
- 新增 xtask 任务规则：将任务状态改为 `done` 前，必须先获得用户明确确认
- 修复 `scripts/start.sh`：改为 `nohup` 脱离终端后台运行，不再依赖启动它的终端持续存在
- 增强 `scripts/stop.sh`：新增 `--all` / `all` 指令，扫描当前用户所有 xtask 监听端口并全部关闭
- 更新 `scripts/README.md`：补充后台常驻与全量停止示例命令


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
- 终端 SSH 保活：增加 ServerAliveInterval/CountMax/TCPKeepAlive 参数，降低连接断开概率
- 终端输出去重：前端输出拉取改为串行轮询，避免网络抖动导致重复渲染

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
