# xtask 技术设计文档 v1

> 基于 `docs/prd_discussion/` 定稿成果，转化为可执行的技术架构设计。

## 文档索引

| 文件 | 内容 |
|---|---|
| `architecture.md` | 技术栈选型、项目目录结构、关键架构决策 |
| `data-model.md` | task_graph.yaml 完整 schema 定义 |
| `api-spec.md` | REST API 端点设计 |
| `implementation-phases.md` | 分阶段实施计划与交付物 |

## 关联文档

| 文件 | 用途 |
|---|---|
| `docs/prd_discussion/prd_draft.md` | 产品需求定义（功能、信息流、UI/UX、验收） |
| `docs/prd_discussion/acceptance_matrix.md` | 交付物验收矩阵 |
| `docs/design-system/xtask/MASTER.md` | 设计系统主文件（颜色、字体、间距、组件基线） |
| `docs/design-system/xtask/pages/home.md` | 首页布局覆盖 |
| `docs/design-system/xtask/pages/project-detail.md` | 项目子页布局覆盖 |

## 产品定位

- 目标用户：个人用户
- 核心场景：个人项目任务拆解、状态流转、里程碑追踪、进度复盘
- 视觉方向：GitHub-like，紧凑高密度，工程化
- 存储方式：文件化（YAML），无数据库
- 部署方式：单二进制，零依赖运行
