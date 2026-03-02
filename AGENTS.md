# AGENTS.md - Agent 角色与协作规则

## 项目目标（当前阶段）

- 目标产品：一个可通过浏览器访问的项目管理应用
- 视觉方向：整体风格参考 GitHub（简洁、信息密度高、偏工程化）
- 技术约束：允许使用任意编程语言与现代化工具链

## 项目组织与模块功能

### 代码目录

- `backend/`：后端 API、业务规则、YAML 存储
- `frontend/`：前端页面、交互组件、状态管理
- `e2e/`：Playwright 端到端测试

### 文档目录（统一在 `docs/`）

- `docs/design-system/`：设计系统与技术架构文档
- `docs/prd_discussion/`：PRD 讨论、验收矩阵、开放问题
- `docs/ci.md`：CI/测试说明
- `docs/task.md`：任务清单
- `docs/plan.md`：阶段计划清单

### 后端模块职责

- `backend/config`：运行配置
- `backend/model`：领域模型
- `backend/store`：文件存储与项目注册
- `backend/service`：业务逻辑与规则校验
- `backend/handler`：HTTP 接口层

### 前端模块职责

- `frontend/src/pages`：页面入口
- `frontend/src/components`：布局与业务组件
- `frontend/src/stores`：Zustand 状态仓库
- `frontend/src/hooks`：通用行为封装
- `frontend/src/lib`：API 与类型

## 可用 Agent

### Planner (规划者)
- 职责：需求分析、方案设计、任务拆解
- 触发：`/plan` 或复杂功能开发前

### Explorer (探索者)
- 职责：代码库分析、架构扫描、依赖梳理
- 触发：`/explore` 或需要深入理解代码时
- 输出：结构报告与建议

### Implementer (实施者)
- 职责：按计划编写代码，单任务聚焦执行
- 触发：`/implement` 或用户确认计划后
- 原则：最小改动，不做额外“改进”

### Reviewer (审查者)
- 职责：代码审查、安全检查、质量验证
- 触发：`/code-review` 或 `/verify`
- 输出：问题列表与修复建议

## 协作规则

1. **规划先行**：非简单任务先给出实施计划。
2. **确认再动**：重大方案变更需用户确认后实施。
3. **单一职责**：每个 Agent 聚焦本职，不跨界扩散。
4. **文档同步**：结构或设计变更后，至少同步 `README.md`、`PROGRESS.md`，并维护 `docs/task.md`、`docs/plan.md`。
5. **测试优先**：提交前至少执行 `make test`；涉及交互流程变更需执行 `make e2e-test`。
6. **任务登记**：凡是新增任务项，必须同步写入 `docs/task.md`，再进入实现阶段。
