---
name: init-xtask
description: 初始化仓库的 xtask 任务体系时使用：先创建 xtask 的独立空数据分支 `refs/xtask-data`，补齐 xtask 所需的数据与注册信息，检查旧版 `.xtask/` 是否需要迁移，并在仓库内补齐 `xtask-safe` 对应的 `AGENTS.md` 规则；然后与用户做简短交互，给出 3 个左右初始 milestone 方案并在确认后用 CLI 落库。适用于“给仓库接入 xtask”“初始化任务系统”“首次建立 milestone”“迁移旧 `.xtask` 数据”等场景。
---

# 初始化 xtask 任务体系

按下面流程接管一个新仓库或旧仓库的 xtask 初始化工作，默认使用现有 xtask CLI，不直接编辑任务和里程碑 YAML。

## 核心原则

- 把“空分支”理解为 xtask 独立数据分支 `refs/xtask-data`
- 任务、里程碑、worktree 数据优先写入 `refs/xtask-data`
- 仅当仓库已有旧版 `.xtask/` 时，才补齐并迁移旧数据
- 里程碑先给建议，不要未经确认直接创建过多条目
- 一切任务维护动作都要配合 `xtask-safe`，通过 CLI 执行
- 初始化时优先检查仓库根目录 `AGENTS.md` 与 `CLAUDE.md`，把 `xtask-safe` 规则和“任务完成后更新状态并写入总结”的要求写入其中
- 如果仓库还没有 `AGENTS.md` 或 `CLAUDE.md`，必须先征求用户是否创建；只有用户同意后才创建并写入规则

## 初始化流程

### 1. 检查仓库状态

先确认：

- 当前目录是 Git 仓库
- 当前仓库是否已经存在 `refs/xtask-data`
- 是否存在旧版 `.xtask/` 目录
- xtask CLI 是否可用；如果全局 `xtask` 不可用，使用仓库内 `node cli/index.js`

推荐检查命令：

```bash
git rev-parse --show-toplevel
git rev-parse --verify --quiet refs/xtask-data
test -d .xtask && echo legacy-xtask
test -f AGENTS.md && echo has-agents
```

### 2. 先创建 xtask 空数据分支

如果还没有 xtask 数据分支，先初始化：

```bash
xtask init
```

如果全局命令不可用：

```bash
node cli/index.js init
```

这个步骤会创建独立的 Git 数据分支 `refs/xtask-data`，并写入最小骨架：

- `config.yaml`
- `milestones.yaml`

不要为了存放 xtask 数据新建普通开发分支；当前架构以 `refs/xtask-data` 为准。

### 3. 补齐 xtask 相关信息

初始化后按情况补齐：

- 运行 `xtask project register`，确保 `~/.xtask/projects.yaml` 注册当前项目
- 如果仓库已有旧 `.xtask/`，优先运行 `xtask project migrate-to-git`
- 验证 `refs/xtask-data` 中至少存在 `config.yaml` 和 `milestones.yaml`

推荐命令：

```bash
xtask project register
xtask project migrate-to-git
git ls-tree -r --name-only refs/xtask-data
```

当旧 `.xtask/` 不存在时，不要人为再造一套本地 `.xtask/` 数据目录。

### 4. 处理 `AGENTS.md` / `CLAUDE.md` 与 `xtask-safe` 规则

初始化仓库时，还要检查仓库根目录是否已有 `AGENTS.md` 与 `CLAUDE.md`：

- 如果已有文件，直接把 `xtask-safe` 规则补充进去
- 如果缺少其中任一文件，先用一句中文问用户是否允许创建
- 只有在用户明确同意后，才创建缺失文件并写入规则
- 如果用户不同意创建，就跳过这一步，但要在最终汇报里明确说明

推荐写入内容至少包含：

```md
### xtask 使用规范

- 在执行任务维护操作时优先使用 `xtask-safe` 技能
- 所有变更通过 xtask CLI 命令执行
- 子任务正确继承父任务属性
- 禁止删除操作
- 任务完成后，必须通过 `xtask task update <task-id> --status <status>` 更新 xtask 状态
- 任务完成后，必须通过 `xtask task update <task-id> --summary <summary>` 写入任务总结
- 如果要把任务状态改为 `done`，必须先获得用户明确确认
```

推荐确认话术：

```text
当前仓库缺少 AGENTS.md 或 CLAUDE.md。是否需要我帮你创建缺失文件，并写入 xtask-safe 与“任务完成后更新状态/写入总结”的规则？
```

如果仓库里已经有 `AGENTS.md` 或 `CLAUDE.md`，不要再额外征求“是否写入”的确认，直接补齐规则即可。

### 5. 安装 xtask Skills

自动安装 xtask 相关 skills 到目标仓库。运行安装脚本：

```bash
scripts/install-skills.sh --local --agent codex
```

如果目标仓库同时使用 Claude，可改为：

```bash
scripts/install-skills.sh --local --agent both
```

该脚本会自动安装以下 skills：

- `xtask-safe` — 任务状态管理
- `xtask-work` — 任务执行工作流
- `xtask-summary` — 任务完成归档
- `init-xtask` — 初始化 xtask 体系

如果脚本不可用（例如目标仓库未包含 scripts/），可手动复制：

```bash
mkdir -p .codex/skills
cp -r /path/to/xtask/.codex/skills/xtask-safe .codex/skills/
cp -r /path/to/xtask/.codex/skills/xtask-work .codex/skills/
cp -r /path/to/xtask/.codex/skills/xtask-summary .codex/skills/
cp -r /path/to/xtask/.codex/skills/init-xtask .codex/skills/
```

### 6. 与用户做最小交互

完成初始化后，直接用简短中文问题补齐 milestone 背景。优先问 2 个问题，不要一口气问太多：

1. 这个项目当前最重要的交付目标是什么？
2. 你希望第一阶段更偏"接管梳理 / 做出 MVP / 准备发布"哪一种？

如果还需要时间信息，再补第 3 个问题：

3. 是否有明确发布日期或最近 2~4 周的截止时间？

### 7. 先给 milestone 方案，再执行创建

根据用户回答，从 `references/milestone-presets.md` 选择最贴近的一组，通常给 3 个 milestone 即可。

默认输出格式建议：

```text
建议先建 3 个 milestone：
1. 仓库接管与基线建立
2. 核心流程打通 / MVP
3. 稳定化与首次交付
```

在用户确认前，不要直接创建。

### 8. 用 CLI 创建 milestone

用户确认后，再逐条执行：

```bash
xtask milestone create "仓库接管与基线建立"
xtask milestone create "核心流程打通 / MVP"
xtask milestone create "稳定化与首次交付"
```

如果只能使用仓库内 CLI：

```bash
node cli/index.js milestone create "仓库接管与基线建立"
```

创建完成后，可用下面命令回显确认：

```bash
xtask milestone list
```

## 何时迁移旧 `.xtask/`

满足以下条件时，优先迁移：

- 仓库根目录存在 `.xtask/`
- `.xtask/` 下已有 `milestones.yaml`、`tasks/`、`worktrees/` 等历史数据

迁移命令：

```bash
xtask project migrate-to-git
```

迁移后以 `refs/xtask-data` 为唯一事实来源。

## 输出要求

完成这类任务时，最终输出至少要说明：

- 是否已创建 `refs/xtask-data`
- 是否已注册到 `~/.xtask/projects.yaml`
- 是否发现并迁移旧 `.xtask/`
- 是否已补充或创建 `AGENTS.md` / `CLAUDE.md`
- 如果没创建对应文件，是因为用户拒绝还是仓库已跳过
- 是否已安装 xtask skills（xtask-safe, xtask-work, xtask-summary, init-xtask）
- 给用户的 milestone 建议是什么
- 哪一步还需要用户确认
