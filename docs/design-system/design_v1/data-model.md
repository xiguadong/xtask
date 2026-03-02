# 数据模型 — task_graph.yaml Schema

## 概述

每个项目目录维护以下管理文件：

- 任务图：`<project_dir>/.xtask/task_graph.yaml`
- 规则文档：`<project_dir>/.xtask/task_rule_doc.md`

其中 `task_graph.yaml` 是项目任务、里程碑、关系、历史的唯一结构化存储源。

---

## 完整 Schema

```yaml
version: 1

project:
  id: "proj-uuid"
  name: "项目名"
  description: "项目描述"
  status: "healthy"            # healthy | at_risk | blocked
  created_at: "2026-02-28T10:00:00Z"
  updated_at: "2026-02-28T11:00:00Z"
  updated_by: "user"

milestones:
  - id: "ms-001"
    title: "里程碑名称"
    description: "里程碑描述"
    due_date: "2026-03-15"
    status: "open"             # open | closed
    created_at: "2026-02-28T10:00:00Z"

labels:
  - id: "lbl-module-env"
    name: "module:env"
    color: "#0EA5E9"
  - id: "lbl-module-ci"
    name: "module:ci"
    color: "#22C55E"

tasks:
  - id: "task-001"
    title: "任务标题"
    description: "任务描述"
    status: "todo"             # todo | doing | blocked | done
    priority: "high"           # critical | high | medium | low
    due_date: "2026-03-05"
    milestone_id: "ms-001"     # 关联里程碑 ID
    labels: ["lbl-module-env"] # 标签 ID 列表
    created_at: "2026-02-28T10:00:00Z"
    updated_at: "2026-02-28T11:00:00Z"
    updated_by: "user"
    notes: "备注内容"

relations:
  - id: "rel-001"
    type: "parent_child"       # parent_child | blocks | related_strong | related_weak
    source_id: "task-001"      # parent / blocker / related-from
    target_id: "task-002"      # child / blocked / related-to

history:
  - timestamp: "2026-02-28T11:00:00Z"
    task_id: "task-001"
    field: "status"
    old_value: "todo"
    new_value: "doing"
    actor: "user"
```

---

## 字段枚举定义

| 字段 | 可选值 | 说明 |
|---|---|---|
| project.status | `healthy`, `at_risk`, `blocked` | 可计算或人工修正 |
| milestone.status | `open`, `closed` | 里程碑状态 |
| task.status | `todo`, `doing`, `blocked`, `done` | 统一状态机 |
| task.priority | `critical`, `high`, `medium`, `low` | 优先级 |
| relation.type | `parent_child`, `blocks`, `related_strong`, `related_weak` | 关系类型 |

---

## 关系模型规则

| 规则 | 说明 |
|---|---|
| 单父约束 | 一个任务最多 1 个父任务（作为 `parent_child` 的 target 最多出现一次） |
| 多子允许 | 一个任务可有多个子任务 |
| 多对多依赖 | `blocks` 关系允许多对多 |
| 禁止循环 | `blocks` 关系不允许形成环（DFS 检测） |
| 阻塞强约束 | 存在未完成的 `blocks` 上游时，target 任务不能进入 `done` |
| 耦合无约束 | `related_strong` / `related_weak` 不影响状态流转，仅展示 |
| 模块视图约束 | 每个任务至少带一个 `module:*` 标签，默认提供 `module:env` / `module:ci` |

---

## ID 规范

- 使用短前缀 + UUID：`proj-`, `ms-`, `task-`, `lbl-`, `rel-`
- 便于 YAML 文件中人工阅读

---

## 写入策略

- 读-改-写单文件，使用 `tmp → os.Rename` 原子替换
- 每次写入更新 `updated_at` 和 `updated_by`
- `flock` 文件级锁防止并发写入
