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

1. Inspect existing `.xtask` first:
   - Run `sync_task_graph.sh inspect <project_dir>`.
2. Branch by result:
   - `VALID_EXISTING`:
     - ask user whether to add/register current project into xtask management.
     - if user confirms, run `register_project.sh <project_dir>` to persist registry.
     - do not overwrite `.xtask`.
   - `INVALID_EXISTING`:
     - explicitly tell user `.xtask` will be overwritten.
     - continue only after explicit approval, then run:
       - `sync_task_graph.sh init <project_dir> --force-overwrite`
   - `NEED_INIT`:
     - run `sync_task_graph.sh init <project_dir>`.
3. Validate:
   - run `sync_task_graph.sh validate <project_dir>`.
4. Persist confirmed milestones/parent tasks/child tasks.

## Phase 6: Sync governance docs

- Update `AGENTS.md` and `CLAUDE.md` with rule:
  - new tasks and completed tasks must sync to `.xtask/task_graph.yaml`.
- Keep updates idempotent.
