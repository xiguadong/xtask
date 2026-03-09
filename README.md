# xtask

`xtask` 是一个基于文件和 Git 数据分支的本地项目管理系统，用来管理里程碑、任务、worktree 和代理协作。

## 这是什么

`xtask` 把项目管理直接放进仓库里：

- 用 **CLI** 管理任务、里程碑和 worktree
- 用 **Web UI** 查看项目、任务和终端状态
- 用 `refs/xtask-data` 保存项目数据

## 为什么用

- **本地优先**：不依赖外部任务平台
- **跟 Git 走**：任务和开发分支/worktree 可以一起管理
- **结构简单**：YAML 存储，方便排查和扩展
- **适合多任务开发**：一个分支 / worktree 对应一组任务

## 快速开始

先安装依赖：

```bash
cd cli && npm install
cd ../backend && npm install
cd ../frontend && npm install
cd ..
```

然后在仓库根目录执行：

```bash
node cli/index.js init
node cli/index.js project register
node cli/index.js milestone create "MVP"
node cli/index.js task create "我的第一个任务" --milestone m1 --labels demo
./scripts/start.sh 3000
```

启动后访问：`http://localhost:3000`

如果你已经把 CLI 安装成全局命令，也可以直接写成：

```bash
xtask init
xtask project register
xtask milestone create "MVP"
xtask task create "我的第一个任务" --milestone m1 --labels demo
```

## 常用命令

```bash
xtask init
xtask project register
xtask milestone list
xtask task list
xtask task show <id>
xtask task update <id> --status done
xtask worktree list
xtask worktree tasks
```

任务状态统一使用：

- `todo`
- `in_progress`
- `done`
- `blocked`

## Codex / Skill 用法

如果你是通过 Codex 维护任务，遵循这两条：

- 涉及任务状态更新、建子任务、拆分任务时，优先使用 `xtask-safe` skill
- 所有任务变更通过 `xtask` CLI 完成，不直接修改 YAML

## 数据位置

- 全局项目注册：`~/.xtask/projects.yaml`
- 项目数据分支：`refs/xtask-data`

典型结构：

```text
milestones.yaml
tasks/<task-id>/task.yaml
branches/<branch>/<task-id>.yaml
worktrees/<branch>.yaml
```

## 目录结构

```text
xtask/
├── cli/
├── backend/
├── frontend/
├── scripts/
├── docs/
├── cache/
└── logs/
```
