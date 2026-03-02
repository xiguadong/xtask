# 分阶段实施计划

## 概述

MVP 实施分为 7 个阶段，按依赖顺序推进。每阶段有明确交付物和验证标准。

## 当前实施状态（2026-02-28）

- P1：已完成（后端骨架 + YAML 存储 + 项目 API + 前端基础路由/布局）
- P2：已完成第一版（任务 CRUD、看板、拖拽状态变更、基础状态机约束）
- P3：已完成第一版（关系 CRUD、循环检测、阻塞 done 校验、详情抽屉与关系徽标）
- P4：已完成第一版（首页项目总览、状态泳道、里程碑进度聚合）
- P5：已完成第一版（筛选栏、多字段过滤、URL 参数同步、列表视图）
- P6：已完成第一版（history 记录、响应式抽屉、关键 `data-testid`、focus/skip-link）
- P7：已完成第一版（关键路径 E2E + 后端集成测试已跑通，桌面/移动视口均通过）

---

## P1：骨架与数据层

**目标**：搭建前后端骨架，打通数据读写链路。

**后端**：
- 初始化 Go module，配置 chi router，健康检查端点
- 定义 Go 结构体（model/）镜像 task_graph.yaml schema
- 实现 yaml_store.go：读写 YAML，原子保存（tmp→rename）
- 实现 project_registry.go：扫描目录，返回项目列表
- 接通 `GET /api/projects` 和 `GET /api/projects/:id`

**前端**：
- 初始化 Vite + React + TypeScript + Tailwind
- 映射设计系统 token 到 tailwind.config.ts
- 实现 Shell.tsx 布局、TopBar.tsx、Sidebar.tsx
- 配置 React Router：`/` 和 `/project/:id`

**验证**：后端返回 API 数据，前端渲染骨架布局。

---

## P2：任务 CRUD 与看板

**目标**：实现任务增删改查，看板拖拽状态变更。

**后端**：
- task_service.go：CRUD + 状态机校验（状态转换规则）
- task_handler.go：REST 端点
- 状态机强制：`blocked → done` 仅在无活跃 blocked_by 时允许

**前端**：
- taskStore.ts：Zustand store + API 集成
- BoardView.tsx + BoardColumn.tsx + TaskCard.tsx
- TaskForm.tsx：快速创建模式（最小字段集）
- @dnd-kit 拖拽：列间拖动触发状态变更
- StatusBadge.tsx、PriorityIcon.tsx
- SkeletonCard.tsx、EmptyState.tsx、ErrorState.tsx

**验证**：可创建任务、看板展示、拖拽切换状态。

---

## P3：任务详情与关系

**目标**：实现详情抽屉、关系建模、阻塞约束。

**后端**：
- graph_service.go：关系 CRUD、循环检测（DFS）、阻塞链解析
- 关系端点：创建/删除关系
- 阻塞强约束：状态变更为 `done` 时校验上游依赖

**前端**：
- TaskDrawer.tsx：核心字段内联编辑、关系列表、活动日志
- RelationList.tsx + RelationBadges.tsx：卡片关系徽标（P, C:n, B:n, BB:n, R!, R~）
- TaskForm.tsx：高级创建模式（关系、父任务、耦合等级）
- 关系点击 → 滚动并高亮目标任务
- 阻塞规则提示：可执行修复入口

**验证**：可创建关系、看到徽标、阻塞约束生效。

---

## P4：里程碑与首页

**目标**：实现里程碑聚合、首页项目总览。

**后端**：
- milestone_service.go：CRUD + 进度聚合（按状态统计关联任务）
- 里程碑端点
- 项目健康状态计算（基于阻塞数、逾期任务）

**前端**：
- HomePage.tsx：首页总览
- StatusLanes.tsx：Healthy / At Risk / Blocked 三列
- ProjectCard.tsx：项目名、活跃里程碑、进度、阻塞数、截止标记
- SummaryRail.tsx：总项目数、本周到期、阻塞总数、快捷链接
- MilestoneList.tsx + MilestoneProgress.tsx
- 项目卡片点击 → 进入项目子页

**验证**：首页展示项目概览，里程碑进度准确。

---

## P5：搜索筛选与列表视图

**目标**：实现多字段筛选、列表视图、键盘快捷键。

**后端**：
- search_service.go：多字段筛选 + 关键词搜索

**前端**：
- FilterBar.tsx：状态、优先级、里程碑、标签、截止时间、是否阻塞
- useFilter.ts：筛选状态 ↔ URL 参数双向同步
- ListView.tsx：表格/列表替代视图
- 看板/列表切换按钮（TopBar）
- 保存筛选视图（Sidebar）
- useKeyboard.ts：`N` 新建、`/` 搜索、`Escape` 关闭

**验证**：筛选生效、URL 可书签、列表视图数据与看板一致。

---

## P6：历史、响应式、无障碍

**目标**：变更历史、移动端适配、无障碍、单二进制打包。

**后端**：
- 每次任务/关系变更自动追加 history 记录
- go:embed 嵌入前端 dist
- Makefile：`make build` 产出单二进制

**前端**：
- ActivityLog.tsx：详情抽屉内的变更时间线
- 响应式：移动端侧边栏折叠、详情抽屉改为全屏上滑
- data-testid 属性：按设计系统要求标注所有关键元素
- 无障碍：focus-visible ring、aria 标签、skip link、键盘导航
- 状态反馈：骨架屏加载、空状态引导、错误重试

**验证**：移动端可用、键盘可完成核心流程、单二进制可运行。

---

## P7：E2E 测试与验收

**目标**：按验收矩阵编写自动化测试，达成自检覆盖率。

**测试框架**：Playwright

**测试内容**：
- 项目与任务状态流转（关键路径连续 10 次回放）
- 看板与列表视图一致性
- 里程碑进度聚合正确性
- 任务关系规则（循环检测、阻塞约束）
- 新建任务双模（快速/高级）
- 两级页面信息流闭环
- 页面结构自检（DOM/组件存在性）

**视口**：
- 桌面：1366x768
- 移动：390x844

**通过标准**：
- 自动自检覆盖率 ≥ 90%
- 关键路径项通过率 = 100%
- 布局结构阻塞偏差 = 0
- 人工终检通过风格一致性

**验证**：Playwright 测试全部通过，截图基线建立。

---

## 阶段依赖关系

```
P1 → P2 → P3 → P4
                 ↘
P2 → P5 → P6 → P7
```

- P3 和 P5 可在 P2 完成后并行启动
- P4 依赖 P3（里程碑需要关系数据）
- P6 依赖 P4 和 P5
- P7 依赖 P6
