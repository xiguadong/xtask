---
name: xtask-safe
description: Safe xtask task management with enforced constraints. Use this skill WHENEVER the user asks to update task status, create subtasks, split tasks, derive tasks from parent tasks, or perform any xtask task maintenance operations. Always invoke this skill for any task-related changes to ensure CLI safety, inheritance rules, and deletion prevention.
---

# xtask-safe

通过 xtask CLI 安全管理任务的约束流程。

## 何时使用

当用户提到以下任何操作时，立即使用此技能：
- 更新任务状态（如标记完成、进行中）
- 创建子任务或派生任务
- 任务拆分
- 修改任务属性
- 任何涉及 xtask 任务维护的操作

## 三条强制规则

1. **仅用 CLI**：任务变更必须走 `xtask` 命令，严禁直接编辑 YAML
2. **子任务继承**：创建子任务必须继承父任务 milestone 和 labels，并追加 `parent:<父ID>` 和 `agent:claude` 标签
3. **禁止删除**：严禁执行任何 `xtask delete` 命令

## 工作流程

### 更新任务状态
```bash
xtask task update <task-id> --status <new-status>
# 可用状态: pending | in_progress | completed | blocked
```

### 创建子任务（完整流程）

1. 先查询父任务信息获取 milestone 和 labels：
```bash
xtask task get <parent-id>
```

2. 使用继承的属性创建子任务：
```bash
xtask task create "子任务标题" \
  --milestone <父任务的milestone> \
  --labels <父任务的labels>,parent:<parent-id>,agent:claude
```

### 任务拆分

1. 标记原任务为父任务：
```bash
xtask task update <parent-id> --labels <原labels>,parent-task
```

2. 为每个子任务创建记录（继承父任务属性）：
```bash
xtask task create "子任务1" --milestone <M> --labels <继承>,parent:<parent-id>,agent:claude
xtask task create "子任务2" --milestone <M> --labels <继承>,parent:<parent-id>,agent:claude
```

## 示例场景

**场景1：标记任务完成**
```bash
xtask task update T-001 --status completed
```

**场景2：从父任务创建子任务**
```bash
# 父任务 T-001: milestone=M1, labels=backend,api
xtask task create "实现用户认证API" \
  --milestone M1 \
  --labels backend,api,parent:T-001,agent:claude
```

**场景3：拆分大任务**
```bash
# 1. 标记父任务
xtask task update T-001 --labels backend,api,parent-task

# 2. 创建子任务
xtask task create "设计数据库schema" --milestone M1 --labels backend,api,parent:T-001,agent:claude
xtask task create "实现API端点" --milestone M1 --labels backend,api,parent:T-001,agent:claude
xtask task create "编写单元测试" --milestone M1 --labels backend,api,parent:T-001,agent:claude
```
