# Workflow Details

## Phase 1: Explore

- Scan candidate files with priority:
  - `README.md`
  - `design*.md` / `docs/design-system/**`
  - `plan.md` / `docs/plan.md`
  - `task.md` / `docs/task.md`
- Extract goal, current status, risks, and candidate module names.

## Phase 2: Analyze

- Produce milestone options in 3 tiers: 2 / 3 / 4+
- Propose parent tasks per milestone.
- Propose child tasks with module labels.

## Phase 3: Confirm milestone count

- Present options (2/3/4+) and tradeoffs.
- Lock final milestone set only after user confirmation.

## Phase 4: Co-plan parent tasks

- Propose parent tasks for each milestone.
- Confirm module set with user.
- Always include defaults: `module:env`, `module:ci`.

## Phase 5: Create/update management files

- Ensure `<project>/.xtask/` exists.
- Ensure `<project>/.xtask/task_graph.yaml` exists and is valid.
- Ensure `<project>/.xtask/task_rule_doc.md` exists.
- Persist confirmed milestones/parent tasks/child tasks.

## Phase 6: Sync governance docs

- Update `AGENTS.md` and `CLAUDE.md` with rule:
  - new tasks and completed tasks must sync to `.xtask/task_graph.yaml`.
- Keep updates idempotent.
