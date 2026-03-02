---
name: xtask-project-orchestrator
description: Explore repository status, derive milestones/tasks from README/design/plan/task docs, confirm with user, and maintain <project>/.xtask/task_graph.yaml + task_rule_doc.md with AGENTS/CLAUDE sync rules.
---
# xtask-project-orchestrator

Use this skill when user asks to bootstrap or operate xtask management for a local project.

## Workflow

1. Explore project status (automatic)
2. Analyze and derive milestone/task candidates
3. Confirm milestone count with user (2/3/4+ options)
4. Co-plan parent tasks with user
5. Inspect existing `<project>/.xtask/`, then create/update with confirmation rules
6. Sync task graph update rules into repo `AGENTS.md` and `CLAUDE.md`

Detailed workflow: `references/workflow.md`
Data schema and conventions: `references/schema.md`

## Commands

### 1) Explore docs and repo state

```bash
bash .codex/skills/xtask-project-orchestrator/scripts/extract_context.sh <project_dir>
```

### 2) Inspect existing `.xtask` first (required)

```bash
bash .codex/skills/xtask-project-orchestrator/scripts/sync_task_graph.sh inspect <project_dir>
```

Interpretation:
- `status: VALID_EXISTING`:
  - must ask user whether to add/register current project to xtask management.
  - do not overwrite files.
- `status: INVALID_EXISTING`:
  - must explicitly tell user the `.xtask` directory will be overwritten.
  - continue only after user allows it.
- `status: NEED_INIT`:
  - safe to initialize.

### 3) Initialize management files (safe mode)

```bash
bash .codex/skills/xtask-project-orchestrator/scripts/sync_task_graph.sh init <project_dir>
```

### 4) Initialize with overwrite (only after user approval)

```bash
bash .codex/skills/xtask-project-orchestrator/scripts/sync_task_graph.sh init <project_dir> --force-overwrite
```

### 5) Validate management files

```bash
bash .codex/skills/xtask-project-orchestrator/scripts/sync_task_graph.sh validate <project_dir>
```

### 6) Sync AGENTS/CLAUDE rules

```bash
bash .codex/skills/xtask-project-orchestrator/scripts/sync_rules_docs.sh <repo_root>
```

## Required rules

- Source priority for extraction: `README > design* > plan.md > task.md`
- Default module labels: `module:env`, `module:ci`
- New tasks and completed tasks must update `<project>/.xtask/task_graph.yaml`
- Keep both `AGENTS.md` and `CLAUDE.md` in sync with the rule above
- Never overwrite existing `.xtask` when invalid unless user explicitly approves
- When `.xtask` is valid, ask user whether to add/register this project into xtask management
