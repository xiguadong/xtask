# 项目管理应用需求讨论（进行中）

## 当前共识（2026-02-28）
- 产品目标：构建一个可通过浏览器访问的项目管理应用。
- 视觉方向：参考 GitHub（简洁、信息密度高、工程化）。
- 技术约束：语言与工具链开放，可采用更现代方案。
- 协作方式：先完成细致需求讨论与技术路线，再进入实施。
- 输出目录：`prd_discussion/`。
- 新规则：默认不以加速为目标，优先细致讨论和充分澄清。
- 目标用户：个人用户。
- 功能偏好：风格对齐 GitHub，功能上优先对齐 Milestones。
- 层级结构：仅项目一级。
- 权限模型：简化版。
- 成功标准口径：不建立 KPI 系统，采用功能验收门槛。
- 状态流转：`待办 -> 进行中 -> 阻塞 -> 已完成`。
- 任务必填字段：`标题、描述、状态、优先级、截止日期、里程碑`。
- 首页默认视图：看板。
- 非目标（已冻结）：不做多人协作通知、不做外部集成、不做自动化规则。
- 新议题：任务关系建模（父子/依赖/耦合/独立）与新建任务交互流程。
- 关系约束确认：`Blocked-By` 为强约束（未解除阻塞不能完成）；`Related` 区分强耦合与弱耦合。
- 新建任务流程定稿：`New Task` + `Add Subtask`，快速/高级双模。
- 轻量化数据策略：每个项目目录维护 `<project_dir>/.agents/task_graph.yaml`，由 AGENTS 维护。
- 新增验收方向：后续需确认最终界面布局与风格，并验证实现一致性。
- 已产出：两级布局 ASCII 基线草图（首页项目总览 + 项目详情子页）、风格基线、布局一致性检查清单与截图点位。
- 验收机制：自动自检覆盖大部分功能与布局一致性，人工执行最终风格确认。
- 已升级：UI-UX Pro Max 设计细则（交互、状态、联动、可访问性）与自动自检清单。
- 已固化设计系统资产：`design-system/xtask/MASTER.md` + `pages/home.md` + `pages/project-detail.md`（Master + Override）。
- 阶段进度：A/B/C/D/E 全部完成，需求与验收已定稿。
- 状态：高阻塞待确认项已清空，可进入实施阶段。

## 已产出文档
- `prd_discussion/discussion_log.md`
- `prd_discussion/open_questions.md`
- `prd_discussion/prd_draft.md`
- `prd_discussion/acceptance_matrix.md`

## 下一步
- 进入实施阶段（`/implement`），按 `design-system/xtask` 与 `acceptance_matrix.md` 开发并自检。
