# 更新xtask任务模板功能 - 代码分析

## 需求分析

### 核心需求
为 xtask 增加任务进展文档管理功能，包括 `task.md` 和 `analysis.md` 两个文档，
贯穿任务创建、执行、归档的完整生命周期。

### 用户确认的方案

1. **`xtask_todos/` 位于 worktree 根目录** - 方案A
2. **commit 时先归档到 xtask 数据分支，再删除本地文件后提交**
3. **复用 cn_todos 模板，减少确认流程**
4. **project-description 统一管理，从 main/master 分支拷贝**
5. **同时创建 `.claude/skills/` 和 `.codex/skills/` 的 xtask-todo skill**
6. **Web 详情页：左 task.md / 右 analysis.md，支持源码/渲染切换**

---

## 代码库调研

### 1. CLI worktree create 流程 (`cli/commands/worktree.js`)

**当前行为**:
- 接收 branch 名和 path 参数
- 创建 worktree YAML 到 `worktrees/{branch}.yaml`
- 不涉及本地文件创建

**需要修改**:
- worktree 创建后，在工作目录下创建 `xtask_todos/` 文件夹
- 生成 `task.md` 和 `analysis.md` 模板
- 从 main/master 分支拷贝 `todos/project-description.md` (如果存在)

### 2. CLI task update 的 done 处理 (`cli/commands/task.js`)

**当前行为**:
- `buildDoneStatusSyncChanges()` 同步分支任务状态到主任务
- 仅更新 YAML 状态字段

**需要修改**:
- 标记 done 前检查 `xtask_todos/` 是否存在
- 将 task.md 和 analysis.md 归档到 `refs/xtask-data:tasks/{id}/`
- 归档后删除本地 `xtask_todos/` 目录

### 3. gitDataStore 文件读写 (`cli/utils/gitDataStore.js`)

**当前能力**:
- `readFile()` / `writeFiles()` 支持读写 Git 数据分支文件
- 已支持 MD 文件存储 (description.md, summary.md)

**可复用**: 归档 task.md / analysis.md 直接使用现有 writeFiles()

### 4. 后端 API 层 (`backend/src/services/taskService.js`)

**当前能力**:
- `getTask()` 已支持 hydrate description_content / summary_content
- taskContent.js 支持读取 MD 文件内容

**需要新增**:
- 读取 task.md / analysis.md 的 API 或服务方法
- 区分数据源：进行中从文件系统读取，已完成从 xtask 数据分支读取

### 5. 前端 TaskDetailPage (`frontend/src/pages/TaskDetailPage.tsx`)

**当前布局**:
- 左侧信息面板 + 中间 Markdown 编辑器 + 右侧工作树/终端面板

**需要新增**:
- 右侧增加进度框（显示 task.md 状态摘要）
- 新建 TodoDocsPage: 左 task.md / 右 analysis.md，支持源码/渲染切换

---

## 数据流设计

### 任务生命周期中的文件流转

```
[worktree 创建]
    ↓
worktree_root/xtask_todos/
  ├── task.md          ← 任务状态和实现计划
  ├── analysis.md      ← 代码调研和技术分析
  └── project-description.md ← 从 main/master 拷贝

[任务进行中]
    ↓
Web 页面从文件系统 (worktree_root/xtask_todos/) 读取

[任务完成 (done)]
    ↓
1. 读取 xtask_todos/task.md 和 analysis.md
2. 写入 refs/xtask-data:tasks/{id}/todo-task.md 和 todo-analysis.md
3. 删除本地 xtask_todos/ 目录
4. 提交代码

[完成后查看]
    ↓
Web 页面从 refs/xtask-data:tasks/{id}/ 读取归档文档
```

### API 路由设计

```
GET /api/projects/:name/tasks/:id/todo-docs
  → 返回 { task_md, analysis_md, source: 'local' | 'archive' }

  逻辑：
  1. 检查任务状态
  2. 如果 status != done → 从文件系统读取 worktree/xtask_todos/
  3. 如果 status == done → 从 xtask 数据分支读取
```

### 前端路由

```
/projects/:name/tasks/:id/todo-docs  → TodoDocsPage
  - 左侧: task.md 内容
  - 右侧: analysis.md 内容
  - 顶部: 切换按钮（源码/渲染）
```

---

## 影响范围

### CLI 变更
- `cli/commands/worktree.js` - 创建后初始化 xtask_todos/
- `cli/commands/task.js` - done 时归档文档

### 后端变更
- `backend/src/routes/taskRoutes.js` - 新增 todo-docs API
- `backend/src/services/taskService.js` - 新增读取 todo 文档的方法

### 前端变更
- 新增 `TodoDocsPage.tsx` - 文档详情页
- 修改 `TaskDetailPage.tsx` - 右侧增加进度框
- 新增 `useTodoDocs.ts` hook
- 更新路由配置

### 技能定义
- `.claude/skills/xtask-todo/SKILL.md` - Claude 版技能
- `.codex/skills/xtask-todo/SKILL.md` - Codex 版技能
