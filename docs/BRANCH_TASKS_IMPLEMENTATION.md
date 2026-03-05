# 分支任务管理架构实现文档

## 概述

本实现为 xtask 项目添加了多分支并行开发的任务管理能力，解决了多个 worktree 同时开发时的 Git 冲突问题。

## 核心问题

**原有问题**：
- 所有任务存储在 `.xtask/tasks/` 目录
- 多个分支同时修改任务文件导致合并冲突
- 无法在 Web UI 中查看各分支的开发状态

**解决方案**：
- 分支任务隔离存储在 `.xtask/branches/{branch}/`
- 使用 Git attributes 配置 `merge=ours` 策略
- 添加 Worktree 元数据追踪

## 已实现功能

### 1. 后端服务层

**worktreeService.js**
- `createWorktree()` - 创建 worktree 元数据
- `getWorktrees()` - 获取所有 worktree
- `getWorktree()` - 获取单个 worktree
- `updateWorktree()` - 更新 worktree 信息
- `deleteWorktree()` - 删除 worktree

**branchTaskService.js**
- `assignTaskToBranch()` - 分配任务到分支
- `getBranchTasks()` - 获取分支所有任务
- `updateBranchTask()` - 更新分支任务
- `mergeTaskToMain()` - 合并任务到主分支
- `createBranchTask()` - 在分支中创建新任务

**taskService.js 增强**
- 添加 `branch` 过滤器支持
- 添加 `description_file` 字段支持 markdown 描述
- 添加 `getTaskDescription()` 读取 markdown 文件

### 2. 后端 API 层

**Worktree API** (`/api/projects/:projectName/worktrees`)
- `GET /` - 获取所有 worktree
- `POST /` - 创建新 worktree
- `GET /:branch` - 获取指定 worktree
- `PUT /:branch` - 更新 worktree
- `DELETE /:branch` - 删除 worktree

**分支任务 API** (`/api/projects/:projectName/branches/:branch/tasks`)
- `GET /` - 获取分支所有任务
- `POST /` - 在分支中创建任务

**任务 API 增强**
- `POST /tasks/:id/merge` - 合并分支任务到主分支
- `GET /tasks/:id/description` - 获取 markdown 描述
- `PUT /tasks/:id/assign` - 支持 `branch` 参数

### 3. CLI 工具

**worktree 命令**
```bash
xtask worktree create <branch> --path <path> [--agent <identity>] [--model <model>]
xtask worktree list
xtask worktree info <branch>
xtask worktree rename <oldBranch> <newBranch>
xtask worktree delete <branch>
```

**task 命令增强**
```bash
xtask task create <title> [--parent <id>] [--description-file]
xtask task assign <id> --branch <branch>
xtask task merge <id> --from-branch <branch>
```

**自动分支检测**：在 worktree 中执行 `xtask task create` 会自动检测当前分支并创建到对应的分支目录。

### 4. 前端组件

**类型定义** (`types/index.ts`)
- `Worktree` 接口
- `Task` 接口增强（`description_file`, `git.source_branch`）

**Hooks**
- `useWorktrees(projectName)` - Worktree 数据管理

**组件**
- `WorktreeCard` - 显示单个 worktree 信息
- `WorktreeList` - Worktree 列表和创建表单
- `TaskCard` - 显示分支标识（🌿）和子任务标记
- `ProjectDetailPage` - 添加任务/Worktrees 视图切换

### 5. Git 配置

**.gitattributes**
```
.xtask/branches/** merge=ours
.xtask/worktrees/** merge=ours
```

确保分支特定文件在合并时保留当前分支版本，避免冲突。

## 数据结构

### 目录结构
```
.xtask/
├── config.yaml
├── milestones.yaml
├── tasks/                    # 主分支任务
│   └── {task-id}/
│       ├── task.yaml
│       └── description.md    # 可选
├── branches/                 # 分支任务（隔离）
│   └── {branch-name}/
│       └── {task-id}.yaml
└── worktrees/                # Worktree 元数据
    └── {branch-name}.yaml
```

### Worktree 元数据格式

**文件**: `.xtask/worktrees/{branch}.yaml`
```yaml
branch: feature/add-login
worktree_path: /path/to/worktree/feature-add-login
created_at: '2026-03-05T10:00:00.000Z'
agent:
  identity: claude-opus-4
  model: claude-opus-4-6
status: active  # active | merged | deleted
tasks:
  - 1772699384409-login-ui
  - 1772699384410-auth-api
last_commit: null
```

### 分支任务格式

**文件**: `.xtask/branches/{branch}/{task-id}.yaml`
```yaml
id: 1772699384409-login-ui
title: 实现登录界面
description: 简短描述
description_file: tasks/1772699384409-login-ui/description.md  # 可选
status: in_progress
priority: high
milestone_id: m1
parent_tasks: []
labels: [ui, auth]
created_at: '2026-03-05T08:29:44.409Z'
updated_at: '2026-03-05T10:15:00.000Z'
created_by: cli
agent:
  assigned: true
  identity: claude-opus-4
  assigned_at: '2026-03-05T10:00:00.000Z'
  status: running
git:
  branch: feature/add-login
  commits: []
  source_branch: master
```

### 主分支任务格式

**文件**: `.xtask/tasks/{task-id}/task.yaml`
```yaml
id: 1772699384409-login-ui
title: 实现登录界面
description: 简短描述
description_file: null
status: todo
priority: medium
milestone_id: null
parent_tasks: []
labels: []
created_at: '2026-03-05T08:29:44.409Z'
updated_at: '2026-03-05T08:29:44.409Z'
created_by: web
agent:
  assigned: false
  identity: null
  assigned_at: null
  status: null
git:
  branch: null
  commits: []
```

## 使用流程

### 完整工作流程

**1. 创建 Git Worktree**
```bash
cd /path/to/main/repo
git worktree add /path/to/worktree/feature-login -b feature/login
```

**2. 注册 Worktree 到 xtask**
```bash
cd /path/to/worktree/feature-login
xtask worktree create feature/login --path $(pwd) --agent claude-opus-4
```

**3. 分配已有任务到分支**
```bash
# 在主仓库中分配
cd /path/to/main/repo
xtask task assign <task-id> --branch feature/login
```

**4. 在分支中创建新任务（自动检测）**
```bash
cd /path/to/worktree/feature-login
xtask task create "实现登录表单" --parent <parent-id>
# 任务自动创建到 .xtask/branches/feature-login/
```

**5. 开发完成后合并**
```bash
# 提交代码
cd /path/to/worktree/feature-login
git add . && git commit -m "完成登录功能"

# 回到主仓库合并
cd /path/to/main/repo
git merge feature/login  # 零冲突

# 合并任务数据
xtask task merge <task-id> --from-branch feature/login
```

**6. 清理 Worktree**
```bash
git worktree remove /path/to/worktree/feature-login
xtask worktree delete feature/login
```

### 分支重命名

如果需要重命名 Git 分支，使用以下流程：

```bash
# 1. 重命名 Git 分支
git branch -m old-branch new-branch

# 2. 同步 xtask 数据
xtask worktree rename old-branch new-branch
```

`xtask worktree rename` 会自动：
- 重命名 worktree 元数据文件
- 重命名 branches 目录
- 更新所有任务的 `git.branch` 字段

## 核心特性

### 1. 分支隔离存储
- 主分支任务：`.xtask/tasks/{id}/task.yaml`
- 分支任务：`.xtask/branches/{branch}/{id}.yaml`
- 不同分支修改不同文件，避免冲突

### 2. 零冲突合并
- Git attributes 配置 `merge=ours` 策略
- 分支文件在合并时保留当前分支版本
- 任务数据通过 CLI 命令手动合并

### 3. 自动分支检测
- CLI 通过 `git rev-parse --abbrev-ref HEAD` 检测当前分支
- 在 worktree 中创建任务自动归属到当前分支
- 子任务自动继承父任务的分支属性

### 4. 完整可见性
- Web UI 可查看所有 worktree 状态
- 任务卡片显示分支标识（🌿）
- 支持按分支过滤任务

### 5. Markdown 描述支持
- 简单任务使用 `description` 字段
- 复杂任务创建独立 `description.md` 文件
- 支持图片、代码块等富文本内容

## 技术实现要点

### 后端
- 使用 YAML 文件存储，无需数据库
- 服务层与路由层分离，便于测试
- 统一错误处理和响应格式

### CLI
- 使用 Commander.js 构建命令行工具
- 通过 `execSync` 执行 Git 命令
- 自动检测项目根目录

### 前端
- React Hooks 管理状态
- TypeScript 类型安全
- Tailwind CSS 样式

## 验证测试

运行验证脚本：
```bash
./scripts/verify-implementation.sh
```

编译前端：
```bash
cd frontend && npm run build
```

启动服务器：
```bash
./scripts/start.sh
```
