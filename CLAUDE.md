# CLAUDE.md - xtask 项目规范

## 项目概述

xtask 是一个面向个人用户的 Web 项目管理应用，风格对齐 GitHub（紧凑、高信息密度、工程化）。
核心能力：项目空间与任务管理、看板/列表视图、里程碑追踪、任务关系建模。

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 状态管理 | Zustand |
| 拖拽 | @dnd-kit |
| 图标 | Lucide React |
| 路由 | React Router v6 |
| 后端 | Go + chi router |
| 数据 | YAML 文件（gopkg.in/yaml.v3） |
| 部署 | go:embed 单二进制 |
| E2E | Playwright |

## 项目结构

```
xtask/
├── backend/                # Go 后端（model/ store/ service/ handler/）
├── frontend/               # React 前端（components/ stores/ hooks/ pages/）
├── e2e/                    # Playwright 验收测试
└── docs/
    ├── design-system/      # UI 设计系统与技术设计文档
    └── prd_discussion/     # PRD 讨论文档
```

## 数据存储

- 文件化存储：每个项目 `<project_dir>/.xtask/task_graph.yaml`
- 写入策略：read → modify → write tmp → `os.Rename`（原子替换）
- 并发控制：`flock` 文件级锁
- 项目注册：`~/.xtask/projects.json` 维护目录路径列表

## 设计系统治理

- Master + Page Override 继承模式
- 实现首页 → 先读 `docs/design-system/xtask/pages/home.md`，未覆盖项继承 `MASTER.md`
- 实现子页 → 先读 `docs/design-system/xtask/pages/project-detail.md`，未覆盖项继承 `MASTER.md`
- Tailwind 配置直接映射 MASTER.md 中的 token（颜色、间距、圆角）
- 图标仅用 Lucide，禁止 emoji 作为 UI 图标

## 核心模型

- 任务状态：`todo` → `doing` → `blocked` → `done`
- 优先级：`critical` | `high` | `medium` | `low`
- 关系类型：`parent_child` | `blocks` | `related_strong` | `related_weak`
- 阻塞强约束：存在未完成的 `blocks` 上游时，任务不能进入 `done`
- 单父约束：一个任务最多 1 个父任务
- 禁止循环依赖（DFS 检测）

## 页面架构

- 两级页面：`/`（首页总览）+ `/project/:id`（项目子页）
- 首页：项目状态泳道（Healthy/At Risk/Blocked）+ 项目卡片 + Summary Rail
- 子页：侧边栏 + 看板/列表主区 + 按需详情抽屉
- 筛选状态通过 URL 参数保持，支持书签与回放

## API 约定

- 前缀：`/api`，返回 JSON
- RESTful 风格：项目 → 任务 → 里程碑 → 关系 → 历史
- 错误统一格式：`{ "error": { "code": "...", "message": "...", "details": {} } }`
- 详见 `docs/design-system/design_v1/api-spec.md`

## 开发约定

### 代码规范
- 代码简洁，避免过度工程化
- 函数职责单一，命名清晰
- 必要时添加注释，不做冗余注释

### 工作流程
1. 先阅读 PROGRESS.md 了解当前状态
2. 设计变更必须先更新 PROGRESS.md
3. 重大变更需用户确认后再实施
4. 新建任务与完成任务后，必须回写 `<project_dir>/.xtask/task_graph.yaml`

### 文档职责

| 文件 | 用途 | 更新时机 |
|------|------|----------|
| `CLAUDE.md` | 项目规范与开发约定 | 规范变更时 |
| `AGENTS.md` | Agent 角色与协作规则 | Agent 流程变更时 |
| `PROGRESS.md` | 设计方案与实现进度 | 每次设计讨论后 |
| `docs/design-system/design_v1/` | 技术设计文档 | 架构变更时 |
| `docs/design-system/xtask/` | UI 设计系统 | 视觉规范变更时 |
| `docs/prd_discussion/` | PRD 讨论记录 | 需求变更时 |

## 注意事项

- 始终先更新文档再编码
- 保持设计方案与实现同步
- 遵循最小改动原则

<!-- XTASK_RULES_START -->
## xtask Sync Rules

- 新建任务与完成任务后，必须同步更新 `<project_dir>/.xtask/task_graph.yaml`。
- 每次状态变化必须同步回写任务图并追加历史记录。
<!-- XTASK_RULES_END -->
