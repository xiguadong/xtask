# REST API 端点设计

## 概述

后端提供 JSON API，前缀 `/api`。所有端点返回 JSON 格式。
项目 `:id` 映射到注册的目录路径（哈希索引）。

---

## 项目端点

```
GET    /api/projects              # 项目列表（含摘要统计）
POST   /api/projects              # 注册新项目目录
GET    /api/projects/:id          # 单项目详情
```

### GET /api/projects 响应示例

```json
{
  "projects": [
    {
      "id": "proj-abc",
      "name": "xtask",
      "status": "healthy",
      "active_milestone": "MVP Release",
      "progress": 45,
      "blocked_count": 2,
      "due_soon": true
    }
  ],
  "summary": {
    "total": 5,
    "due_this_week": 2,
    "blocked_total": 3
  }
}
```

---

## 任务端点

```
GET    /api/projects/:id/tasks              # 任务列表（支持筛选）
POST   /api/projects/:id/tasks              # 创建任务
PUT    /api/projects/:id/tasks/:taskId      # 更新任务
DELETE /api/projects/:id/tasks/:taskId      # 删除任务
```

### 筛选参数（GET /api/projects/:id/tasks）

| 参数 | 类型 | 说明 |
|---|---|---|
| `status` | string | 按状态筛选：todo, doing, blocked, done |
| `priority` | string | 按优先级筛选：critical, high, medium, low |
| `milestone` | string | 按里程碑 ID 筛选 |
| `labels` | string | 按标签 ID 筛选（逗号分隔） |
| `due_before` | string | 截止日期早于（ISO8601） |
| `due_after` | string | 截止日期晚于（ISO8601） |
| `is_blocked` | bool | 是否被阻塞 |
| `q` | string | 关键词搜索（标题 + 描述） |

### POST /api/projects/:id/tasks 请求体

```json
{
  "title": "实现看板视图",
  "description": "构建默认看板视图，包含四列状态列",
  "priority": "high",
  "due_date": "2026-03-05",
  "milestone_id": "ms-001",
  "labels": ["lbl-002"],
  "parent_id": null,
  "relations": []
}
```

- `status` 默认 `todo`
- 从父任务创建时自动继承 `milestone_id`（可修改）

---

## 里程碑端点

```
GET    /api/projects/:id/milestones           # 里程碑列表（含进度）
POST   /api/projects/:id/milestones           # 创建里程碑
PUT    /api/projects/:id/milestones/:msId     # 更新里程碑
```

### 里程碑响应含进度聚合

```json
{
  "id": "ms-001",
  "title": "MVP Release",
  "due_date": "2026-03-15",
  "status": "open",
  "progress": {
    "total": 10,
    "done": 3,
    "doing": 4,
    "blocked": 1,
    "todo": 2,
    "percent": 30
  }
}
```

---

## 关系端点

```
POST   /api/projects/:id/relations            # 创建关系
DELETE /api/projects/:id/relations/:relId     # 删除关系
```

### POST /api/projects/:id/relations 请求体

```json
{
  "type": "blocks",
  "source_id": "task-001",
  "target_id": "task-002"
}
```

### 校验规则

- `parent_child`：target 不能已有父任务
- `blocks`：不能形成循环依赖（后端 DFS 检测）
- 创建成功返回 201，校验失败返回 422 + 错误原因

---

## 历史端点

```
GET    /api/projects/:id/history              # 变更历史
```

### 筛选参数

| 参数 | 类型 | 说明 |
|---|---|---|
| `task_id` | string | 按任务 ID 筛选 |
| `limit` | int | 返回条数（默认 50） |
| `offset` | int | 分页偏移 |

---

## 错误响应格式

所有错误统一返回：

```json
{
  "error": {
    "code": "CYCLE_DETECTED",
    "message": "添加此依赖关系会形成循环",
    "details": {
      "chain": ["task-001", "task-003", "task-001"]
    }
  }
}
```

### 常见错误码

| HTTP 状态 | 错误码 | 场景 |
|---|---|---|
| 400 | `INVALID_INPUT` | 字段校验失败 |
| 404 | `NOT_FOUND` | 项目/任务/里程碑不存在 |
| 409 | `BLOCKED_CONSTRAINT` | 任务被阻塞，不能完成 |
| 422 | `CYCLE_DETECTED` | 依赖关系形成循环 |
| 422 | `DUPLICATE_PARENT` | 任务已有父任务 |
