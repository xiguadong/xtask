# .xtask 数据结构示例

> 更新（2026-03-06）：xtask 数据已迁移至 Git 专用分支 `refs/xtask-data`，本文示例路径仅作结构参考，实际读写以 Git 数据分支为准。

本文档展示 xtask 项目的完整数据结构示例。

## 目录结构

```
.xtask/
├── config.yaml              # 项目配置
├── milestones.yaml          # 里程碑列表
├── tasks/                   # 主分支任务
│   └── 1741234567890-example-task/
│       ├── task.yaml
│       └── description.md   # 可选
├── branches/                # 分支任务（隔离）
│   ├── feature-login/
│   │   ├── 1741234567891-login-ui.yaml
│   │   └── 1741234567892-login-api.yaml
│   └── feature-auth/
│       └── 1741234567893-auth-service.yaml
└── worktrees/               # Worktree 元数据
    ├── feature-login.yaml
    └── feature-auth.yaml
```

## 文件内容示例

### config.yaml
```yaml
project_name: xtask
created_at: '2026-03-05T11:00:00.000Z'
```

### milestones.yaml
```yaml
milestones:
  - id: m1
    name: 分支任务管理
    description: 实现多分支并行开发功能
    due_date: '2026-03-31'
    status: active
    goals:
      - title: 完成后端 API
        done: true
      - title: 完成 CLI 工具
        done: true
      - title: 完成前端界面
        done: true
  - id: m2
    name: 性能优化
    description: 优化系统性能
    due_date: null
    status: active
    goals:
      - title: 优化数据库查询
        done: false

### 任务状态枚举

用户态任务状态固定为以下四种：

- `todo`：未开始
- `in_progress`：进行中
- `done`：已完成
- `blocked`：被阻塞

除以上四种外，不应在用户文档、CLI 示例、前端选项中出现其他任务状态。

### tasks/{task-id}/task.yaml (主分支任务)
```yaml
id: 1741234567890-example-task
title: 示例任务
description: 这是一个主分支任务示例
description_file: null
status: todo
priority: medium
milestone_id: m1
parent_tasks: []
labels: [backend, api]
created_at: '2026-03-05T08:00:00.000Z'
updated_at: '2026-03-05T08:00:00.000Z'
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

### branches/{branch}/{task-id}.yaml (分支任务)
```yaml
id: 1741234567891-login-ui
title: 实现登录界面
description: 创建用户登录表单和验证逻辑
description_file: tasks/1741234567891-login-ui/description.md
status: in_progress
priority: high
milestone_id: m1
parent_tasks: []
labels: [frontend, ui, auth]
created_at: '2026-03-05T09:00:00.000Z'
updated_at: '2026-03-05T10:30:00.000Z'
created_by: cli
agent:
  assigned: true
  identity: claude-opus-4
  assigned_at: '2026-03-05T09:15:00.000Z'
  status: running
git:
  branch: feature-login
  commits: [abc123, def456]
  source_branch: master
```

### worktrees/{branch}.yaml (Worktree 元数据)
```yaml
branch: feature-login
worktree_path: /home/user/projects/worktrees/feature-login
created_at: '2026-03-05T09:00:00.000Z'
agent:
  identity: claude-opus-4
  model: claude-opus-4-6
status: active
tasks:
  - 1741234567891-login-ui
  - 1741234567892-login-api
last_commit: abc123def456
```

### tasks/{task-id}/description.md (可选的 Markdown 描述)
```markdown
# 实现登录界面

## 需求描述

创建一个用户登录界面，包含以下功能：

1. 用户名/邮箱输入
2. 密码输入（带显示/隐藏切换）
3. 记住我选项
4. 登录按钮
5. 忘记密码链接

## 技术要点

- 使用 React + TypeScript
- 表单验证使用 Zod
- 样式使用 Tailwind CSS

## 验收标准

- [ ] 表单验证正常工作
- [ ] 支持键盘回车提交
- [ ] 错误提示友好
- [ ] 响应式设计
```

## 子任务示例

父任务在分支中，子任务也在同一分支：

```yaml
# 父任务: branches/feature-login/1741234567891-login-ui.yaml
id: 1741234567891-login-ui
title: 实现登录界面
parent_tasks: []
git:
  branch: feature-login

# 子任务: branches/feature-login/1741234567894-form-validation.yaml
id: 1741234567894-form-validation
title: 实现表单验证逻辑
parent_tasks: [1741234567891-login-ui]
git:
  branch: feature-login
  source_branch: master
```

## 数据流转

1. **创建任务** → `.xtask/tasks/{id}/task.yaml`
2. **分配到分支** → 复制到 `.xtask/branches/{branch}/{id}.yaml`
3. **分支开发** → 只修改 `.xtask/branches/{branch}/{id}.yaml`
4. **合并到主分支** → 更新 `.xtask/tasks/{id}/task.yaml`，删除分支文件
