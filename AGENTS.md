# xtask 项目配置（Codex）

## 项目概述

xtask 是一个基于文件的本地项目管理系统，用于跟踪任务、里程碑和代理分配。

## 技术栈

- **CLI**: Node.js + Commander.js
- **后端**: Express + YAML 文件存储
- **前端**: React 18 + TypeScript + Tailwind CSS

## 开发规范

### 语言要求
- **所有回复使用中文**
- 代码注释使用中文
- 文档使用中文

### 文档规范

**关键改动和版本发布必须记录到 `PROGRESS.md` 文件中。**

- 新功能完成后更新 PROGRESS.md
- 版本发布时更新版本历史
- 重大架构变更需要记录

### 代码风格
- 使用 ES modules
- 保持代码简洁，避免过度工程
- 优先使用函数式组件和 Hooks

### 文件结构
```
xtask/
├── cli/           # CLI 工具
├── backend/       # Express API
├── frontend/      # React 前端
├── scripts/       # 脚本文件（启动/停止/测试）
├── docs/          # 文档目录（设计文档、实现文档）
├── cache/         # 临时文件、暂存文件
└── logs/          # 服务器日志
```

### 项目结构约束

**必须遵守的目录规范：**

1. **scripts/** - 所有脚本文件
   - 启动/停止脚本
   - 测试验证脚本
   - 构建脚本

2. **docs/** - 所有文档文件
   - 设计文档
   - 实现文档
   - API 文档
   - `task.md` - 任务记录（必须）

3. **docs/task.md** - 任务追踪文档
   - 每次实现新功能必须记录
   - 格式：`- [x] 任务描述 (完成日期)`
   - 未完成任务：`- [ ] 任务描述`

4. **cache/** - 临时文件和暂存文件
   - 所有临时文件必须存放在此目录
   - 构建产物、下载文件、临时数据等
   - 该目录应添加到 .gitignore

## 数据存储

- 全局配置: `~/.xtask/projects.yaml`
- 项目数据: `refs/xtask-data` (Git 专用分支)
  - `milestones.yaml` - 里程碑
  - `tasks/<id>/task.yaml` - 任务详情

## 常用命令

### CLI
```bash
xtask init                    # 初始化项目
xtask project register        # 注册项目
xtask milestone create <name> # 创建里程碑
xtask task create <title>     # 创建任务
xtask worktree tasks          # 列出当前分支/worktree 的任务
xtask worktree tasks <branch> # 列出指定 worktree 分支的任务
```

### 脚本
```bash
./scripts/start.sh [port]     # 启动服务器
./scripts/stop.sh             # 停止服务器
./scripts/build.sh            # 编译前端
```

## Codex Skills

- `xtask-safe`: `.codex/skills/xtask-safe/SKILL.md`
- `ui-ux-pro-max`: `.codex/skills/ui-ux-pro-max/SKILL.md`

### xtask 使用规范

在执行任务维护操作时优先使用 `xtask-safe` 技能，确保：
- 所有变更通过 xtask CLI 命令执行
- 子任务正确继承父任务属性
- 禁止删除操作

详见：`.codex/skills/xtask-safe/SKILL.md`

## 文件系统安全规范

**严格禁止对以下全局目录进行删除或写入操作：**

- `/opt` - 系统软件目录
- `/tmp` - 系统临时目录
- `/backup` - 备份目录
- `/home` - 用户主目录（除当前用户目录外）
- `/data` - 数据目录

**允许的操作范围：**

- 当前用户目录：`/home/xiguapro/` 及其子目录
- 项目工作目录及其子目录
- 项目 cache 目录

## 开发注意事项

1. 后端使用纯 JavaScript，无需编译
2. 前端需要编译后才能使用
3. 启动脚本会自动检测端口占用
4. 所有数据存储在 YAML 文件中
