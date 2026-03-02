# Data Schema And Rules

## Paths

- Project graph file: `<project>/.xtask/task_graph.yaml`
- Rule document: `<project>/.xtask/task_rule_doc.md`
- Registry: `~/.xtask/projects.json` (or `$XTASK_REGISTRY`)

## task_graph.yaml required top-level keys

- `version`
- `project`
- `milestones`
- `labels`
- `tasks`
- `relations`
- `history`

## Enumerations

- `project.status`: `healthy | at_risk | blocked`
- `task.status`: `todo | doing | blocked | done`
- `task.priority`: `critical | high | medium | low`
- `relation.type`: `parent_child | blocks | related_strong | related_weak`

## Module labeling

- Store module dimension as labels with `module:*` prefix.
- Required defaults: `module:env`, `module:ci`.
- Additional module labels must be user-confirmed.

## Update contract

- On task create/complete/update:
  - update task fields
  - update `project.updated_at` and `project.updated_by`
  - append one `history` entry
