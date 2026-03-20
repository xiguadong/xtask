# 更新xtask任务模板功能

**Status:** AwaitingCommit
**Agent PID:** 1373362

## Original Todo

xtask任务支持新的功能:
- xtask增加 task.md 和 analysis.md; 用于标记任务状态和进展；
- 创建分支时，会自动创建一个文件夹，xtask_todos/，下面创建两个新的文档，task.md, analysis.md;
- task.md / analysis.md，结构参考 todos 描述
- 增加一个 xtask_todo skill，用于更新这两个文档
- xtask 完成任务后，将这两个文档拷贝到 xtask分支中，完成任务后，就不能修改这两个文档了；
- xtask 子页面上需要有个地方能够看到这两个文档的状态；
- 完成任务后，xtask 子页面应当从xtask分支获取这两个文档；任务进行时，xtask子页面从 xtask_todos 获取这两个文档

## Description

为 xtask 增加任务进展文档管理功能，在 worktree 根目录下创建 `xtask_todos/` 文件夹，包含 task.md 和 analysis.md 两个文档，贯穿任务创建、执行、归档的完整生命周期。

_阅读 [analysis.md](./analysis.md) 以获取详细的代码库调研和上下文_

## Implementation Plan

### 阶段一：CLI 基础设施
- [x] 修改 `cli/commands/worktree.js` - worktree 创建后初始化 `xtask_todos/` 目录
  - 生成 task.md 模板（复用 cn_todos 格式，简化确认流程）
  - 生成 analysis.md 模板
  - 从 main/master 拷贝 `todos/project-description.md`（如果存在）
- [x] 修改 `cli/commands/task.js` - task 标记 done 时归档文档
  - 读取 worktree 中 `xtask_todos/task.md` 和 `analysis.md`
  - 写入 `refs/xtask-data:tasks/{id}/todo-task.md` 和 `todo-analysis.md`
  - 删除本地 `xtask_todos/` 目录

### 阶段二：后端 API
- [x] 新增 API 路由 `GET /api/projects/:name/tasks/:id/todo-docs`
  - 任务进行中 -> 从文件系统读取 worktree/xtask_todos/
  - 任务已完成 -> 从 xtask 数据分支读取归档文档
  - 返回 `{ task_md, analysis_md, source: 'local' | 'archive', has_files: boolean }`

### 阶段三：前端页面
- [x] 修改 `TaskDetailPage.tsx` - 右侧增加 Todo 进度框
  - 显示 task.md 状态摘要（Status 字段）
  - 点击跳转到 TodoDocs 详情页
- [x] 新增 `TodoDocsPage.tsx` - 文档详情页
  - 左侧: task.md 内容
  - 右侧: analysis.md 内容
  - 顶部切换: 源码查看 / 渲染查看
- [x] 新增 `useTodoDocs.ts` hook
- [x] 更新前端路由配置

### 阶段四：Skill 定义
- [x] 创建 `.claude/skills/xtask-todo/SKILL.md` - Claude 版技能
- [x] 创建 `.codex/skills/xtask-todo/SKILL.md` - Codex 版技能

### 阶段五：验证
- [x] 构建前端并验证（315 modules, 0 errors）

## Notes

- task.md 和 analysis.md 在 xtask 数据分支中存储为 `todo-task.md` 和 `todo-analysis.md`，避免与现有 `task.yaml` 冲突
- project-description.md 从 main/master 分支 worktree 根目录的 `todos/project-description.md` 拷贝
- 进度框仅在有 xtask_todos 或归档文档时显示
- 新增文件列表:
  - `cli/utils/xtaskTodos.js` - CLI 端 xtask_todos 工具模块
  - `backend/src/utils/xtaskTodos.js` - 后端端 xtask_todos 工具模块
  - `frontend/src/pages/TodoDocsPage.tsx` - Todo 文档详情页
  - `frontend/src/hooks/useTodoDocs.ts` - 数据 hook
  - `.claude/skills/xtask-todo/SKILL.md` - Claude 技能
  - `.codex/skills/xtask-todo/SKILL.md` - Codex 技能
