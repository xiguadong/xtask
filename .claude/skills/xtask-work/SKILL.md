---
name: xtask-work
description: "xtask 任务执行工作流。当用户提示这是 xtask 分支、需要开始 xtask 任务时触发。运行 scripts/xtask-work.sh 获取任务信息，使用 xtask-safe 管理状态，使用 xtask-todo 管理文档。"
---

# xtask-work

执行 xtask 任务的工作流程协调。

## 何时使用

当用户提到以下任何操作时，使用此技能：
- 提示当前是 xtask 分支，需要开始执行任务
- 需要获取任务信息和协调工作流

## 工作流程

### 1. 获取任务信息

```bash
bash scripts/xtask-work.sh
```

### 2. 使用 xtask-todo 管理文档

- 阅读 `xtask_todos/task.md` 了解任务状态
- 更新 `xtask_todos/analysis.md` 记录代码调研
- 按照 Implementation Plan 逐步完成任务

### 3. 使用 xtask-safe 管理状态

- 更新任务状态：`xtask task update <id> --status in_progress`
- 创建子任务时继承 milestone 和 labels
- 任务完成后：`xtask task update <id> --status done`

### 4. 完成任务

1. 所有实现步骤完成
2. 将 `xtask_todos/task.md` 的 Status 改为 `AwaitingCommit`
3. 使用 xtask-summary 归档任务文档和总结
4. 通过 xtask-safe 标记任务为 done

## 注意事项

- 始终通过 xtask CLI 管理任务状态，不直接编辑 YAML
- 子任务必须继承父任务的 milestone 和 labels
- 任务完成前先与用户确认
