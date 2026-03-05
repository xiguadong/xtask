# xtask 项目配置

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
├── scripts/       # 启动/停止脚本
└── logs/          # 服务器日志
```

## 数据存储

- 全局配置: `~/.xtask/projects.yaml`
- 项目数据: `<project>/.xtask/`
  - `milestones.yaml` - 里程碑
  - `tasks/<id>/task.yaml` - 任务详情

## 常用命令

### CLI
```bash
xtask init                    # 初始化项目
xtask project register        # 注册项目
xtask milestone create <name> # 创建里程碑
xtask task create <title>     # 创建任务
```

### 脚本
```bash
./scripts/start.sh [port]     # 启动服务器
./scripts/stop.sh             # 停止服务器
./scripts/build.sh            # 编译前端
```

## 开发注意事项

1. 后端使用纯 JavaScript，无需编译
2. 前端需要编译后才能使用
3. 启动脚本会自动检测端口占用
4. 所有数据存储在 YAML 文件中
