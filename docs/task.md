# 任务列表

## 当前状态快照（2026-03-03）

- 进行中：0
- 待办：10
- 已完成：20
- 已同步到 xtask 管理任务图：15（含本次完成 3 项 high 优先级任务）

## 进行中

- （空）

## 待办

- [ ] 讨论并分析“按模块划分 / 按节点划分”视图方案（当前仅有 task 记录视图）
- [ ] xtask 页面增加删除项目、删除任务功能
- [ ] 里程碑更多边界场景测试（空里程碑、跨里程碑迁移）
- [ ] 历史记录分页测试（limit/offset）
- [ ] CI 平台化（GitHub Actions 或同类）
- [ ] 文档交叉链接自检脚本
- [ ] [个人使用][module:env] 子页面增加添加标签功能
- [ ] [个人使用][module:env] 修复子页面 Board 视图无法查看详情页
- [ ] [个人使用][module:env,module:backend] 任务详情页增加修改 milestone 阶段、feature 模块、plan 模块、label 模块的能力
- [ ] [个人使用][module:env] 任务详情页点击刷新报错 404 page not found（先记录，不实现）

## 已完成

- [x] P7 扩展 E2E：补充更多筛选组合与关系跳转场景
- [x] 增加 API 错误码细化断言（INVALID_INPUT / NOT_FOUND）
- [x] 增加前端单元测试基础（组件/Store 级）
- [x] [个人使用][module:skill] 更新 skill：将 `.xtask/` 加入 `.gitignore`，避免切换分支导致该目录冲突与脏改动
- [x] [个人使用][module:skill] 为 `.codex/skills/xtask-project-orchestrator` 增加添加到 `~/.xtask/projects.json` 的功能
- [x] 路径迁移：项目管理文件从 `.agents` 一次性切换到 `.xtask`，并加入后端自动迁移逻辑
- [x] 新增 `<project_dir>/.xtask/task_rule_doc.md`，并补齐 `docs/templates/task_rule_doc.md`
- [x] 建立 skill：`.codex/skills/xtask-project-orchestrator`（探索/分析/初始化/规则同步）
- [x] 将“新建任务与完成任务回写 `.xtask/task_graph.yaml`”规则写入 `AGENTS.md` 与 `CLAUDE.md`
- [x] 强化 skill 规则：创建 `.xtask` 前必须先 inspect，合法则先询问是否加入管理，不合法则告知覆盖并需用户明确允许
- [x] 新增任务：创建和完善 `.gitignore`（忽略临时文件与生成目录），并执行仓库初始化（`git init`）
- [x] 规范补充：新增任务必须同步更新 `docs/task.md`，并写入 `AGENTS.md`
- [x] 添加 xtask 管理项目示例（README 增删改说明、`docs/templates/` 模板与字段文档、当前项目注册）
- [x] 文档结构迁移到 `docs/`（`design-system` / `prd_discussion`）
- [x] 完整 README 与 AGENTS 模块说明补齐
- [x] 后端单元 + 集成测试补齐
- [x] E2E 桌面/移动视口关键路径通过
- [x] 梳理当前项目状态，并将任务清单同步添加到 xtask 管理中（写入 `.xtask/task_graph.yaml`）
- [x] 新增 Plan View：按里程碑节点展示计划与两层子任务
- [x] 新增 Feature View：按 `feature:` 标签分组任务并支持快速状态更新
- [x] [个人使用][module:env] 在主页面增加删除项目功能
