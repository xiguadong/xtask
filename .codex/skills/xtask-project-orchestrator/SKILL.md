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
5. Create/update management files in `<project>/.xtask/`
6. Sync task graph update rules into repo `AGENTS.md` and `CLAUDE.md`

Detailed workflow: `references/workflow.md`
Data schema and conventions: `references/schema.md`

## Commands

### 1) Explore docs and repo state

```bash
bash .codex/skills/xtask-project-orchestrator/scripts/extract_context.sh <project_dir>
```

### 2) Initialize management files

```bash
bash .codex/skills/xtask-project-orchestrator/scripts/sync_task_graph.sh init <project_dir>
```

### 3) Validate management files

```bash
bash .codex/skills/xtask-project-orchestrator/scripts/sync_task_graph.sh validate <project_dir>
```

### 4) Sync AGENTS/CLAUDE rules

```bash
bash .codex/skills/xtask-project-orchestrator/scripts/sync_rules_docs.sh <repo_root>
```

## Required rules

- Source priority for extraction: `README > design* > plan.md > task.md`
- Default module labels: `module:env`, `module:ci`
- New tasks and completed tasks must update `<project>/.xtask/task_graph.yaml`
- Keep both `AGENTS.md` and `CLAUDE.md` in sync with the rule above
