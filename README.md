# xtask

`xtask` 是一个面向个人项目管理的 Web 应用，风格偏 GitHub-like（简洁、高信息密度、工程化）。

- 前端：React 18 + TypeScript + Vite + Tailwind + Zustand + dnd-kit
- 后端：Go + chi + YAML 文件存储
- 存储：`<project_dir>/.xtask/task_graph.yaml`
- 规则文档：`<project_dir>/.xtask/task_rule_doc.md`
- 部署：`go:embed` 嵌入前端产物，单二进制运行

## 项目组织

```text
xtask/
├── backend/                # API 服务、业务规则、YAML 存储
├── frontend/               # Web 前端
├── e2e/                    # Playwright 端到端测试
├── docs/
│   ├── design-system/      # 设计系统与技术设计文档
│   ├── prd_discussion/     # PRD 讨论与验收矩阵
│   ├── templates/          # xtask 管理模板与字段说明
│   ├── ci.md               # CI/测试说明
│   ├── task.md             # 任务列表
│   └── plan.md             # 计划列表
├── Makefile
├── AGENTS.md
└── README.md
```

## 模块功能

### backend/

- `config/`：环境配置（端口、项目注册表路径）
- `model/`：领域模型与枚举
- `store/`：YAML 读写、原子写、项目注册与扫描
- `service/`：业务规则（状态机、关系约束、筛选、聚合）
- `handler/`：HTTP API 路由与统一错误响应
- `main.go`：服务启动、路由组装、静态资源托管

### frontend/

- `src/pages/`：首页、项目页
- `src/components/`：布局、看板、列表、计划视图、功能视图、抽屉、共享组件
- `src/stores/`：项目与任务状态管理（Zustand）
- `src/hooks/`：URL 筛选同步、快捷键、关系徽标
- `src/lib/`：API 客户端、类型定义、常量

### e2e/

- `playwright.config.ts`：测试环境与视口配置（desktop/mobile）
- `tests/`：关键路径回归用例

## 快速开始

### 1) 安装依赖

```bash
make frontend-install
cd e2e && npm install
```

### 2) 本地开发（前后端分开）

终端 A：

```bash
cd backend
GOPROXY=https://goproxy.cn,direct go run .
```

终端 B：

```bash
cd frontend
npm run dev
```

访问：`http://localhost:5173`

### 3) 生产构建（单二进制）

```bash
make build
./bin/xtask
```

默认监听 `:8080`。可用环境变量：

- `PORT`：服务端口
- `XTASK_REGISTRY`：项目注册表路径（默认 `~/.xtask/projects.json`）

## 测试命令

```bash
# 后端单测 + 前端构建
make test

# E2E（desktop + mobile）
make e2e-test
```

更详细测试说明：[`docs/ci.md`](docs/ci.md)

## 任务与计划

- 任务列表：[`docs/task.md`](docs/task.md)
- 计划列表：[`docs/plan.md`](docs/plan.md)

## xtask Skill

- Skill 路径：`.codex/skills/xtask-project-orchestrator/`
- 探索项目状态：
  - `bash .codex/skills/xtask-project-orchestrator/scripts/extract_context.sh <project_dir>`
- 预检 `.xtask`（先检查是否合规）：
  - `bash .codex/skills/xtask-project-orchestrator/scripts/sync_task_graph.sh inspect <project_dir>`
- 初始化管理文件：
  - `bash .codex/skills/xtask-project-orchestrator/scripts/sync_task_graph.sh init <project_dir>`
- 覆盖初始化（仅在用户明确允许后）：
  - `bash .codex/skills/xtask-project-orchestrator/scripts/sync_task_graph.sh init <project_dir> --force-overwrite`
- 同步 AGENTS/CLAUDE 规则：
  - `bash .codex/skills/xtask-project-orchestrator/scripts/sync_rules_docs.sh <repo_root>`

## API 概览

主要接口前缀 `/api`：

- 项目：`GET/POST /api/projects`，`GET /api/projects/:id`
- 任务：`GET/POST /api/projects/:id/tasks`，`PUT/DELETE /api/projects/:id/tasks/:taskId`
- 里程碑：`GET/POST /api/projects/:id/milestones`，`PUT /api/projects/:id/milestones/:msId`
- 关系：`POST /api/projects/:id/relations`，`DELETE /api/projects/:id/relations/:relId`
- 历史：`GET /api/projects/:id/history`

完整 API 文档：[`docs/design-system/design_v1/api-spec.md`](docs/design-system/design_v1/api-spec.md)

## 项目管理（增加 / 删除 / 修改）

当前版本项目管理接口如下：

- 增加项目：`POST /api/projects`
- 查询项目：`GET /api/projects`，`GET /api/projects/:id`
- 删除/修改项目目录：暂未提供独立 API，使用注册表文件维护
- 兼容迁移：若检测到旧 `.agents/task_graph.yaml`，后端会自动迁移到 `.xtask/task_graph.yaml`，并备份为 `.agents/task_graph.yaml.migrated.bak`

### 1) 增加项目（推荐）

```bash
curl -X POST http://localhost:8080/api/projects \
  -H 'Content-Type: application/json' \
  -d '{"path":"/abs/path/to/your-project"}'
```

### 2) 删除项目（从 xtask 视角移除）

从注册表文件中删除对应路径即可，不会删除项目代码目录：

- 注册表路径：`$XTASK_REGISTRY`（默认 `~/.xtask/projects.json`）
- 模板参考：[`docs/templates/projects.json`](docs/templates/projects.json)

### 3) 修改项目

- 修改项目路径：先从注册表删除旧路径，再按“增加项目”重新注册新路径
- 修改项目元信息：编辑 `<project_dir>/.xtask/task_graph.yaml` 中 `project` 段字段
- 修改项目规则：编辑 `<project_dir>/.xtask/task_rule_doc.md`
- 模板参考：[`docs/templates/task_graph.yaml`](docs/templates/task_graph.yaml)
- 规则模板：[`docs/templates/task_rule_doc.md`](docs/templates/task_rule_doc.md)
- 字段说明：[`docs/templates/README.md`](docs/templates/README.md)

## 设计与产品文档

- 技术设计索引：[`docs/design-system/design_v1/README.md`](docs/design-system/design_v1/README.md)
- 实施计划：[`docs/design-system/design_v1/implementation-phases.md`](docs/design-system/design_v1/implementation-phases.md)
- PRD 草案：[`docs/prd_discussion/prd_draft.md`](docs/prd_discussion/prd_draft.md)
- 验收矩阵：[`docs/prd_discussion/acceptance_matrix.md`](docs/prd_discussion/acceptance_matrix.md)

## 已知事项

- 若 `go` 依赖拉取超时，建议：

```bash
GOPROXY=https://goproxy.cn,direct
```
