# Task Rule Doc

## 1. Goal And Scope

- Project: __PROJECT_NAME__ (__PROJECT_ID__)
- Scope: track milestones, parent tasks, child tasks, and relations in `.xtask/task_graph.yaml`.

## 2. Source Priority

- Priority order: `README > design* > plan.md > task.md`

## 3. Milestone Confirmation Rule

- Propose milestone options (2/3/4+) and confirm with user before planning parent tasks.

## 4. Module View Rule

- Every task must include at least one module label.
- Default module labels: `module:env`, `module:ci`.

## 5. Parent Task Planning Rule

- Parent tasks are planned per milestone and must be confirmed with user.

## 6. Task Graph Update Rule

- New tasks and completed tasks must update `.xtask/task_graph.yaml` immediately.

## 7. AGENTS And CLAUDE Sync Rule

- `AGENTS.md` and `CLAUDE.md` must include the task graph sync rule.
