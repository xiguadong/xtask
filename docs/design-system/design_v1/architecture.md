# 技术架构设计

## 1. 技术栈选型

| 层 | 选型 | 理由 |
|---|---|---|
| 前端框架 | React 18 + TypeScript | 成熟生态，适合数据密集型 UI |
| 构建工具 | Vite | 快速 HMR，配置简单 |
| 样式方案 | Tailwind CSS | 与设计系统 token 直接映射 |
| 状态管理 | Zustand | 轻量无模板，个人工具无需 Redux |
| 拖拽 | @dnd-kit | 看板拖拽状态变更 |
| 图标 | Lucide React | 设计系统指定 |
| 路由 | React Router v6 | 两级路由足够 |
| 后端 | Go (chi router) | 单二进制部署，零运行时依赖 |
| 数据格式 | YAML (gopkg.in/yaml.v3) | PRD 指定文件化存储 |
| 部署 | go:embed 嵌入前端 | 单文件运行，无需 nginx/Docker |
| E2E 测试 | Playwright | 验收矩阵要求截图对照 |

### 为什么选 Go 而非 Node.js

- 单二进制，零运行时依赖，复制即部署
- `embed.FS` 嵌入前端构建产物，无需额外 Web 服务器
- 文件 I/O 直接使用 `os` 包，简洁高效
- 对个人工具而言，运维简单性是关键优势

### 为什么需要后端

浏览器无法写入任意文件系统路径。PRD 要求写入 `<project_dir>/.agents/task_graph.yaml`，跨不同项目目录。薄后端是必须的。

---

## 2. 项目目录结构

```
xtask/
├── backend/
│   ├── main.go                 # 入口，嵌入前端，启动服务
│   ├── config/
│   │   └── config.go           # 配置（项目目录、端口）
│   ├── model/
│   │   ├── task.go             # Task, Milestone, Relation 结构体
│   │   ├── project.go          # Project 元信息结构体
│   │   └── enums.go            # Status, Priority, RelationType 枚举
│   ├── store/
│   │   ├── yaml_store.go       # YAML 读写（原子 tmp→rename）
│   │   └── project_registry.go # 项目目录扫描与管理
│   ├── service/
│   │   ├── task_service.go     # CRUD + 状态机 + 关系校验
│   │   ├── milestone_service.go# 里程碑 CRUD + 进度聚合
│   │   ├── search_service.go   # 筛选与搜索逻辑
│   │   └── graph_service.go    # 循环检测、阻塞链解析
│   ├── handler/
│   │   ├── project_handler.go  # /api/projects 端点
│   │   ├── task_handler.go     # /api/projects/:id/tasks 端点
│   │   ├── milestone_handler.go# /api/projects/:id/milestones 端点
│   │   └── middleware.go       # CORS, 日志, 错误处理
│   └── embed.go                # 嵌入前端 dist
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts      # 设计系统 token 映射
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx              # 路由配置
│       ├── styles/globals.css   # Tailwind 指令 + CSS 变量
│       ├── lib/
│       │   ├── api.ts           # fetch 封装
│       │   ├── types.ts         # TypeScript 接口（镜像后端 model）
│       │   └── constants.ts     # 状态/优先级枚举，快捷键
│       ├── stores/
│       │   ├── projectStore.ts  # 项目列表 store
│       │   └── taskStore.ts     # 当前项目任务 store
│       ├── hooks/
│       │   ├── useKeyboard.ts   # 快捷键（N, /, Escape）
│       │   ├── useFilter.ts     # 筛选状态 + URL 同步
│       │   └── useTaskRelations.ts
│       ├── components/
│       │   ├── layout/          # TopBar, Sidebar, Shell
│       │   ├── shared/          # StatusBadge, FilterBar, EmptyState...
│       │   ├── home/            # StatusLanes, ProjectCard, SummaryRail
│       │   ├── project/         # BoardView, TaskCard, TaskDrawer, TaskForm...
│       │   └── milestone/       # MilestoneList, MilestoneProgress
│       └── pages/
│           ├── HomePage.tsx
│           └── ProjectPage.tsx
│
├── e2e/                         # Playwright 验收测试
├── docs/design-system/          # 设计系统资产（已有）
└── docs/prd_discussion/         # PRD 文档（已有）
```

---

## 3. 关键架构决策

### 3.1 路由

- 仅两条路由：`/`（首页总览）和 `/project/:id`（项目子页）
- 筛选状态通过 URL search params 保持（`?status=doing&milestone=ms-001`）
- 详情抽屉是组件，不是独立路由

### 3.2 状态管理

- Zustand 双 store：`projectStore`（全局项目列表）+ `taskStore`（当前项目任务，切换项目时重置）
- 拖拽与内联编辑使用乐观更新：先更新 UI，API 失败时回滚
- 返回首页时重新拉取项目列表，不做全局缓存失效

### 3.3 文件 I/O

- 每次写操作：read YAML → modify in-memory → write tmp file → `os.Rename`
- `os.Rename` 在同一文件系统上是原子操作，防止写坏
- `flock` 文件级锁防止多标签页并发写入
- 不做 debounce/batch，每次操作完整读写。个人工具 YAML 文件小，性能足够

### 3.4 项目发现

- `~/.xtask/projects.json` 注册项目目录路径列表
- 后端启动时及 API 请求时扫描各路径下的 `.agents/task_graph.yaml`
- "Add Project" 仅注册目录路径，不创建目录

### 3.5 单二进制部署

- `go:embed` 嵌入 Vite 构建产物
- 后端在 `/` 提供 SPA，在 `/api/*` 提供 API
- 运行：`./xtask --port 8080`
- 配置：环境变量或 `~/.xtask/config.yaml`

### 3.6 设计系统治理

- 实现首页时优先读取 `docs/design-system/xtask/pages/home.md`，未覆盖项继承 `MASTER.md`
- 实现项目子页时优先读取 `docs/design-system/xtask/pages/project-detail.md`，未覆盖项继承 `MASTER.md`
- Tailwind 配置直接映射 MASTER.md 中的 token（颜色、间距、圆角）
