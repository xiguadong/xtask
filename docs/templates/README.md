# xtask 管理模板说明

本目录提供三个模板：

- `task_graph.yaml`：单个项目的任务图数据模板（放在 `<project_dir>/.xtask/task_graph.yaml`）
- `task_rule_doc.md`：任务治理规则文档（放在 `<project_dir>/.xtask/task_rule_doc.md`）
- `projects.json`：xtask 项目注册表模板（默认路径 `~/.xtask/projects.json`）

## task_graph.yaml 字段说明

### 顶层字段

| 字段 | 类型 | 功能 |
|---|---|---|
| `version` | number | 数据版本号，当前固定为 `1` |
| `project` | object | 项目基础信息 |
| `milestones` | array | 里程碑列表 |
| `labels` | array | 标签列表 |
| `tasks` | array | 任务列表 |
| `relations` | array | 任务关系列表 |
| `history` | array | 变更历史列表 |

### project

| 字段 | 类型 | 功能 |
|---|---|---|
| `id` | string | 项目 ID（建议 `proj-` 前缀） |
| `name` | string | 项目展示名称 |
| `description` | string | 项目描述 |
| `status` | string | 项目健康状态：`healthy` / `at_risk` / `blocked` |
| `created_at` | string | 创建时间（RFC3339） |
| `updated_at` | string | 最近更新时间（RFC3339） |
| `updated_by` | string | 最近更新人 |

### milestones[]

| 字段 | 类型 | 功能 |
|---|---|---|
| `id` | string | 里程碑 ID（建议 `ms-` 前缀） |
| `title` | string | 里程碑标题 |
| `description` | string | 里程碑描述 |
| `due_date` | string | 截止日期（`YYYY-MM-DD`） |
| `status` | string | 状态：`open` / `closed` |
| `created_at` | string | 创建时间（RFC3339） |

### labels[]

| 字段 | 类型 | 功能 |
|---|---|---|
| `id` | string | 标签 ID（建议 `lbl-` 前缀） |
| `name` | string | 标签名称 |
| `color` | string | 颜色值（HEX，例如 `#2563EB`） |

建议至少包含模块标签：`module:env`、`module:ci`。

### tasks[]

| 字段 | 类型 | 功能 |
|---|---|---|
| `id` | string | 任务 ID（建议 `task-` 前缀） |
| `title` | string | 任务标题 |
| `description` | string | 任务描述 |
| `status` | string | 状态：`todo` / `doing` / `blocked` / `done` |
| `priority` | string | 优先级：`critical` / `high` / `medium` / `low` |
| `due_date` | string | 截止日期（`YYYY-MM-DD`） |
| `milestone_id` | string | 关联里程碑 ID |
| `labels` | array | 标签 ID 列表 |
| `created_at` | string | 创建时间（RFC3339） |
| `updated_at` | string | 最近更新时间（RFC3339） |
| `updated_by` | string | 最近更新人 |
| `notes` | string | 备注 |

### relations[]

| 字段 | 类型 | 功能 |
|---|---|---|
| `id` | string | 关系 ID（建议 `rel-` 前缀） |
| `type` | string | 关系类型：`parent_child` / `blocks` / `related_strong` / `related_weak` |
| `source_id` | string | 源任务 ID |
| `target_id` | string | 目标任务 ID |

### history[]

| 字段 | 类型 | 功能 |
|---|---|---|
| `timestamp` | string | 变更时间（RFC3339） |
| `task_id` | string | 发生变化的任务 ID |
| `field` | string | 变化字段名 |
| `old_value` | string | 旧值 |
| `new_value` | string | 新值 |
| `actor` | string | 操作者 |

## projects.json 字段说明

| 字段 | 类型 | 功能 |
|---|---|---|
| `paths` | array | 被 xtask 管理的项目目录绝对路径列表 |

说明：

- 每个路径必须是本机已存在目录
- 删除路径 = 从 xtask 管理中移除项目，不会删除项目目录本身

## task_rule_doc.md 字段说明

`task_rule_doc.md` 是规则文档，不是结构化 schema。建议固定包含以下章节：

1. Goal And Scope
2. Source Priority
3. Milestone Confirmation Rule
4. Module View Rule（默认模块：`module:env`、`module:ci`）
5. Parent Task Planning Rule
6. Task Graph Update Rule（新建/完成任务要回写 `task_graph.yaml`）
7. AGENTS And CLAUDE Sync Rule
