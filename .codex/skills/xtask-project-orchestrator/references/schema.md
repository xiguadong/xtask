# Data Schema And Rules

## Paths

- Project graph file: `<project>/.xtask/task_graph.yaml`
- Rule document: `<project>/.xtask/task_rule_doc.md`
- Registry: `~/.xtask/projects.json` (or `$XTASK_REGISTRY`)

## Existing `.xtask` handling contract

- If `.xtask` is valid (`task_graph.yaml` + `task_rule_doc.md` pass checks):
  - ask user whether to add/register project to xtask management.
  - if confirmed, append project path into registry via `scripts/register_project.sh`.
  - do not overwrite files.
- If `.xtask` is invalid:
  - explicitly warn that the `.xtask` directory will be overwritten.
  - overwrite only after explicit user approval.

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
