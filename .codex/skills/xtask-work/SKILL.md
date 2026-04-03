---
name: xtask-work
description: xtask 任务执行与进展管理。管理 xtask_todos/ 下的 task.md 和 analysis.md 文档，记录任务状态和代码分析。
---

# xtask-work

通过 xtask 任务文档管理任务执行进展。

## 何时使用

- 执行 xtask 任务
- 跟踪任务进展
- 更新任务状态文档
- 记录代码分析结果

## 工作流程

### 初始化任务文档

在 `xtask_todos/` 目录下创建：
- `task.md` - 任务清单与状态
- `analysis.md` - 代码分析与设计决策

### 更新任务状态

在 `task.md` 中记录：
```markdown
- [x] 已完成的任务 (完成日期)
- [ ] 待完成的任务
```

### 记录代码分析

在 `analysis.md` 中记录：
- 相关文件清单
- 关键代码片段
- 设计决策与理由
