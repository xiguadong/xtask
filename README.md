# xtask

基于文件的本地项目管理系统，用于跟踪任务、里程碑和代理分配。

## 特性

- 📋 任务管理：创建、更新、分配任务
- 🎯 里程碑跟踪：组织任务到里程碑
- 🤖 代理分配：支持多代理协作
- 📁 文件存储：所有数据存储在 YAML 文件中
- 🌐 Web 界面：React 前端 + Express 后端
- 💻 CLI 工具：命令行快速操作

## 技术栈

- **CLI**: Node.js + Commander.js
- **后端**: Express + YAML 文件存储
- **前端**: React 18 + TypeScript + Tailwind CSS

## 安装

```bash
# 安装 CLI 依赖
cd cli && npm install && npm link

# 安装后端依赖
cd ../backend && npm install

# 安装前端依赖并编译
cd ../frontend && npm install && npm run build
```

## 快速开始

```bash
# 初始化项目
cd /path/to/your/project
xtask init
xtask project register

# 创建里程碑
xtask milestone create "MVP Release" --due 2026-04-01

# 创建任务
xtask task create "实现认证功能" --milestone m1 --labels backend,security

# 启动 Web 服务器
xtask start --port 3000
```

## CLI 命令

### 项目管理
- `xtask init` - 初始化 Git 数据分支
- `xtask project register` - 注册当前项目
- `xtask project list` - 列出所有项目
- `xtask project delete <name>` - 删除项目
- `xtask project migrate-to-git` - 迁移旧版 `.xtask` 数据到 Git 分支

### 里程碑管理
- `xtask milestone create <name>` - 创建里程碑
- `xtask milestone list` - 列出里程碑
- `xtask milestone update <id>` - 更新里程碑

### 任务管理
- `xtask task create <title>` - 创建任务
- `xtask task list` - 列出任务
- `xtask task show <id>` - 查看任务详情
- `xtask task update <id>` - 更新任务
- `xtask task assign <id>` - 分配代理

### 服务器
- `xtask start` - 启动 Web 服务器

## Web 界面

启动服务器后访问 `http://localhost:3000`

三级导航结构：
1. 项目列表 - 查看所有项目
2. 项目详情 - 管理里程碑和任务
3. 任务详情 - 查看/编辑任务，分配代理

## 数据结构

```
~/.xtask/              # 全局注册表
  projects.yaml        # 所有注册的项目
  config.yaml          # 全局配置

Git refs/xtask-data    # 项目数据（Git 专用分支）
  config.yaml
  milestones.yaml
  tasks/
    <timestamp-slug>/
      task.yaml
  branches/
  worktrees/
```

## 开发

```bash
# 运行后端
cd backend && npm start

# 运行前端开发服务器
cd frontend && npm run dev

# 编译前端
cd frontend && npm run build
```

## 许可证

MIT
