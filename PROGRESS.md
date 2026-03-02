# PROGRESS

## 2026-02-28
- 完成 `prd_discussion/` 目录下 PRD 讨论文档初始化与持续更新。
- 完成需求阶段 A/B/C：核心需求澄清、功能地图、隐含步骤回放。
- 完成两级页面布局基线（首页项目总览 + 项目详情子页）ASCII 草图。
- 完成“自动自检 + 人工终检”双层 UI/UX 一致性验收机制定义。
- 新增 UI-UX Pro Max 设计细则：
  - 信息层级、过滤检索、关系可读性、左右联动、创建体验、状态评价。
  - 空状态/错误态/加载态规范。
  - 可访问性与键盘效率要求。
- 启用 `ui-ux-pro-max` skill 生成并持久化设计系统资产：
  - `design-system/xtask/MASTER.md`
  - `design-system/xtask/pages/home.md`
  - `design-system/xtask/pages/project-detail.md`
- 将 Master + Override 治理方式写入 PRD 与验收矩阵。
- 完成阶段 D/E 最终定稿：
  - 信息流定稿（一级首页总览流 + 二级子页执行流）
  - 验收矩阵定稿（新增两级页面闭环验收项）
- 下一步：进入 `/implement`，按定稿文档实施。

### 技术架构设计定稿

- 完成技术栈选型：React 18 + TypeScript + Vite + Tailwind（前端）+ Go + chi（后端）
- 完成数据模型设计：task_graph.yaml 完整 schema（项目/里程碑/标签/任务/关系/历史）
- 完成 REST API 设计：项目、任务、里程碑、关系、历史共 12 个端点
- 完成项目目录结构设计：backend/ + frontend/ + e2e/ 三层
- 完成 7 阶段实施计划：P1 骨架 → P2 看板 → P3 关系 → P4 首页 → P5 筛选 → P6 响应式 → P7 验收
- 关键架构决策：
  - 单二进制部署（go:embed 嵌入前端）
  - 文件原子写入（tmp→rename + flock）
  - Zustand 双 store + 乐观更新
  - 两条路由 + URL 参数筛选
  - 设计系统 Master + Override 继承
- 设计文档输出目录：`design-system/design_v1/`
  - `README.md` — 文档索引与产品定位
  - `architecture.md` — 技术栈、目录结构、架构决策
  - `data-model.md` — task_graph.yaml schema 与规则
  - `api-spec.md` — REST API 端点与错误处理
  - `implementation-phases.md` — 分阶段实施计划
- 下一步：按 `design-system/design_v1/implementation-phases.md` 分阶段实施

### 实施落地（implementation-phases 第一版）

- 新增后端工程 `backend/`，完成：
  - Go module 与 chi 路由骨架、`/healthz`
  - YAML 文件存储（`tmp -> rename` 原子写）+ `flock` 文件锁
  - 项目注册表（`~/.xtask/projects.json`）扫描与项目摘要计算
  - 项目/任务/里程碑/关系/历史 API 端点与统一错误响应
  - 任务状态约束（blocked 依赖未完成时禁止 `done`）、关系循环检测、单父约束
  - `go:embed` 前端静态资源与 SPA 回退路由
- 新增前端工程 `frontend/`，完成：
  - Vite + React + TypeScript + Tailwind 初始化
  - 设计 token 映射（颜色、字体、间距、圆角、z-index、动效）
  - 两级路由：`/` 首页总览、`/project/:id` 项目详情
  - 首页状态泳道、项目卡片、Summary Rail
  - 项目页看板/列表切换、筛选栏（URL 同步）、任务创建、拖拽改状态
  - 任务详情抽屉、关系徽标、活动日志、空/错/加载态、快捷键（N / / / Escape）
  - 响应式抽屉（桌面侧滑、移动端底部上滑）与基础无障碍（skip link、focus-visible ring）
- 新增 `e2e/` Playwright 基础配置与 smoke 用例骨架。
- 新增根 `Makefile`：前端构建 + 产物拷贝 + 后端构建。
- 验证结果：
  - `frontend`: `npm run build` 通过
  - `backend`: `go test ./...` 与 `go build ./...` 通过（使用 `GOPROXY=https://goproxy.cn,direct`）

### 文档与测试增强（持续迭代）

- 新增根文档：`README.md`
  - 补充项目架构、运行步骤、构建流程、API 概览、测试命令、E2E 环境说明。
- 完善构建/测试脚本：`Makefile`
  - 增加 `GOPROXY` 参数化，新增 `test`、`e2e-test` 目标。
- 新增 E2E 工程清单：`e2e/package.json`
  - 独立管理 Playwright 依赖与浏览器安装脚本。
- 新增后端测试用例：
  - `backend/service/*_test.go`：阻塞约束、循环检测、单父约束、筛选逻辑。
  - `backend/store/yaml_store_test.go`：YAML 引导与读写回归。
  - `backend/handler/api_integration_test.go`：API 集成测试（201/409/422 关键分支）。
- 前端继续开发修复：
  - `TaskForm` 使用后端返回的新任务 ID 创建关系，修复高级创建关系绑定不稳定问题。
  - `TaskDrawer` 增加关系类型与“Add relation”操作，补齐抽屉关系创建闭环。
- 当前状态：
  - `backend go test ./...` 通过。
  - `frontend npm run build` 通过。
  - Playwright 浏览器下载中（网络慢，已采用长轮询持续执行）。

### 稳定性与测试闭环修复（本轮）

- 修复前端运行时循环更新问题：
  - 将多个组件中的 Zustand 对象 selector 改为逐字段订阅，消除 `Maximum update depth exceeded`。
  - 影响文件：`HomePage`、`ProjectPage`、`Sidebar`、`FilterBar`、`BoardView`、`ListView`、`TaskForm`、`TaskDrawer`、`useFilter`。
- 修复 E2E 断言稳定性：
  - 首页 `home-overview-board` 去重，避免 strict locator 冲突。
- 完善 E2E 运行基线：
  - Playwright 配置增加本地 `headless-shell` 可用性检测与自动回退。
  - 增加稳定启动参数（`--no-sandbox`、`--disable-gpu`、`--disable-dev-shm-usage`）。
  - 移动端项目改为 Chromium 下 `390x844 + touch + isMobile` 视口验证，确保自动化可稳定运行。
- 测试结果（已实跑）：
  - `make test` 通过（后端单测 + 前端构建）。
  - `make e2e-test` 通过：8/8（desktop + mobile）。

### 文档目录重组

- 新增 `docs/` 作为统一文档根目录。
- 已迁移：
  - `design-system/` -> `docs/design-system/`
  - `prd_discussion/` -> `docs/prd_discussion/`
- 新增管理文档：
  - `docs/ci.md`（测试与 CI 说明）
  - `docs/task.md`（任务列表）
  - `docs/plan.md`（计划列表）
- 已更新 `README.md` 与 `AGENTS.md`，补充新的项目组织结构与模块职责描述。

### xtask 项目管理示例补充（2026-03-02）

- `docs/task.md` 新增“xtask 管理项目示例”完成项。
- `README.md` 新增“项目管理（增加 / 删除 / 修改）”章节：
  - 增加项目通过 `POST /api/projects`
  - 删除/修改项目路径通过 `XTASK_REGISTRY` 注册表维护
  - 补充模板与字段说明链接
- 新增模板目录 `docs/templates/`：
  - `docs/templates/task_graph.yaml`
  - `docs/templates/projects.json`
  - `docs/templates/README.md`（字段说明）
- 已将当前项目 `/home/xiguapro/workspace/xtask` 注册到 xtask 管理中（`GET /api/projects` 可见）。
