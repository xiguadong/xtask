# Task Rule Doc

## 1. Goal And Scope

- Project: your-project-name (proj-your_project_id)
- Scope: track milestones, parent tasks, child tasks, and relations in `.xtask/task_graph.yaml`.

## 2. Source Priority

- Priority order: `README > design* > plan.md > task.md`
- If a source is missing, continue with available sources and keep a note in history.

## 3. Milestone Confirmation Rule

- Propose milestone options (2/3/4+) and confirm with user before planning parent tasks.

## 4. Module View Rule

- Every task must include at least one module label.
- Default module labels: `module:env`, `module:ci`.
- Additional module labels must be confirmed with user.

## 5. Parent Task Planning Rule

- Parent tasks are planned per milestone and must be confirmed with user.
- Child tasks should inherit `milestone_id` from parent task.

## 6. Task Graph Update Rule

- New tasks and completed tasks must update `.xtask/task_graph.yaml` immediately.
- Each update must append one history entry with actor and timestamp.

## 7. AGENTS And CLAUDE Sync Rule

- `AGENTS.md` and `CLAUDE.md` in current repository must include the rule:
  - "new and completed tasks must sync to `.xtask/task_graph.yaml`".
