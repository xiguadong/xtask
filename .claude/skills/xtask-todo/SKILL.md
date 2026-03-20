---
name: xtask-todo
description: "xtask 任务进展文档管理。当用户提示这是 xtask 分支、需要执行 xtask 任务时触发。管理 xtask_todos/ 下的 task.md 和 analysis.md 文档，跟踪任务状态和代码分析。"
---

# xtask-todo

管理 xtask 任务的 `xtask_todos/` 进展文档。

## 何时使用

当用户提到以下任何操作时，使用此技能：
- 提示当前是 xtask 分支，需要执行 xtask 任务
- 需要更新 task.md 或 analysis.md
- 需要查看任务进展文档
- 开始执行 xtask 任务时

## xtask_todos/ 目录结构

```
xtask_todos/
├── task.md               # 任务状态和实现计划
├── analysis.md           # 代码库调研和技术分析
└── project-description.md  # 项目描述（从 main/master 拷贝）
```

## 工作流程

### 1. 初始化（worktree 创建时自动完成）

xtask_todos/ 在 worktree 创建时自动初始化，包含模板文件。如果目录不存在，可手动创建：

```bash
mkdir -p xtask_todos
```

### 2. 开始任务

1. 阅读 `xtask_todos/project-description.md` 了解项目背景
2. 更新 `xtask_todos/task.md`：
   - 填写任务标题和原始 Todo
   - 将 Status 设为 `Refining`
   - 编写 Description 和 Implementation Plan

3. 进行代码调研，更新 `xtask_todos/analysis.md`：
   - 记录需求分析
   - 记录代码库调研结果
   - 记录影响范围和数据流设计

### 3. 执行任务

1. 将 `task.md` 中的 Status 改为 `InProgress`
2. 逐一完成 Implementation Plan 中的 checkbox
3. 每完成一个步骤，勾选对应的 checkbox：`- [x]`
4. 遇到问题记录在 Notes 中

### 4. 完成任务

1. 所有 checkbox 完成后，将 Status 改为 `AwaitingCommit`
2. 通过 xtask CLI 标记任务为 done：
   ```bash
   xtask task update <task-id> --status done
   ```
3. CLI 会自动将 task.md 和 analysis.md 归档到 xtask 数据分支，并删除本地 xtask_todos/ 目录

## task.md 模板

```markdown
# [任务标题]

**Status:** Refining | InProgress | AwaitingCommit | Done

## Original Todo

[来自任务描述的原始文本]

## Description

[我们正在构建什么]

_阅读 [analysis.md](./analysis.md) 以获取详细的代码库调研和上下文_

## Implementation Plan

- [ ] 代码变更及位置
- [ ] 自动化测试
- [ ] 用户测试

## Notes

[实现笔记]
```

## analysis.md 模板

```markdown
# 代码分析

## 需求分析

[需求理解和拆解]

## 代码库调研

[相关文件、函数、模式的调研结果]

## 影响范围

[变更涉及的文件和模块]

## 数据流设计

[数据流转和接口设计]
```

## 注意事项

- task.md 中的 Status 字段会在 Web 页面的 Todo 进度框中显示
- checkbox 完成度会自动统计并显示进度条
- 任务完成后（done），文档归档到 xtask 数据分支，变为只读
- Web 页面会根据任务状态自动切换数据源（本地/归档）
