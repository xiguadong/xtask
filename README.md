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

## 安装环境

建议先准备以下环境：

- Git
- Node.js 18+
- npm 9+

然后在仓库根目录安装依赖：

```bash
cd cli && npm install && npm link
cd ../backend && npm install
cd ../frontend && npm install
cd ..
```

说明：

- `npm link` 会把本地 CLI 暴露为 `xtask` 命令
- 如果只想使用 Web，不做任务初始化，也仍然需要先安装 `backend` 和 `frontend` 依赖

## 初始化仓库

第一次在仓库里启用 `xtask` 时，按下面顺序执行：

```bash
xtask init
xtask project register
xtask milestone create "MVP"
xtask task create "我的第一个任务" --milestone m1 --labels demo
```

初始化完成后：

- 全局项目注册信息写入 `~/.xtask/projects.yaml`
- 项目任务数据写入 Git 数据分支 `refs/xtask-data`
- 当前仓库会自动补齐 `.codex/skills/xtask-safe` 与 `.codex/skills/init-xtask`

常见数据结构如下：

```text
milestones.yaml
tasks/<task-id>/task.yaml
branches/<branch>/<task-id>.yaml
worktrees/<branch>.yaml
```

## Web 操作

启动 Web 服务：

```bash
./scripts/start.sh 3000
```

停止 Web 服务：

```bash
./scripts/stop.sh
```

说明：

- `./scripts/start.sh` 会先构建前端，再启动后端服务
- 如果传入端口已被占用，脚本会自动尝试后续端口
- 启动成功后，在终端中查看实际访问地址，例如 `http://localhost:3000`

进入 Web 后，通常按这个路径使用：

- **首页**：查看所有项目和终端概览
- **项目页**：查看里程碑、任务列表和 worktree
- **任务页**：查看任务详情、终端和 worktree 操作

## 常用命令

```bash
xtask init
xtask project register
xtask milestone list
xtask task list
xtask task show <id>
xtask task current
xtask task update <id> --summary-file summary.md
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

如果你是在目标仓库里执行 `xtask init`，默认会自动把 `xtask-safe` 与 `init-xtask` 安装到该仓库的 `.codex/skills/`。

如果你想在自己的仓库里复用这里的 Codex skills，可以用下面两种方式：

### 方式一：拷贝到目标仓库

把本仓库里的 skill 目录拷贝到你的目标仓库下：

```bash
mkdir -p /path/to/your-repo/.codex/skills
cp -R .codex/skills/xtask-safe /path/to/your-repo/.codex/skills/
cp -R .codex/skills/init-xtask /path/to/your-repo/.codex/skills/
```

适合场景：

- 希望 skill 跟着某个项目一起分发
- 希望团队成员在该仓库里直接复用同一套规则

### 方式二：安装到全局 `~/.codex`

如果你希望多个仓库共用这些 skill，可以安装到全局目录：

```bash
mkdir -p ~/.codex/skills
cp -R .codex/skills/xtask-safe ~/.codex/skills/
cp -R .codex/skills/init-xtask ~/.codex/skills/
```

适合场景：

- 希望本机所有仓库都能直接使用这些 skill
- 不想在每个项目里重复拷贝 skill 文件

### 推荐说明

- 涉及任务状态更新、建子任务、拆分任务时，优先使用 `xtask-safe`
- 初始化 xtask 任务体系时，优先使用 `init-xtask`
- 所有任务变更通过 `xtask` CLI 完成，不直接修改 YAML
- 将任务状态标记为 `done` 前，先与用户确认
- 如果目标仓库也需要明确约束，建议同时把相关规则写入它自己的 `AGENTS.md`

当前仓库内置 skill 路径：

- `.codex/skills/xtask-safe/SKILL.md`
- `.codex/skills/init-xtask/SKILL.md`

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
