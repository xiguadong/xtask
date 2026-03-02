# Project Detail Page Overrides

> Project: xtask
> Page: level-2 project detail
> This file overrides `docs/design-system/xtask/MASTER.md` only where explicitly stated.

---

## 1. Layout Overrides

- Default desktop layout: `sidebar + main task board/list` with **on-demand detail drawer**
- Do not use permanent three-column task detail layout.
- Drawer opens from right; mobile uses full-screen slide-up sheet.

---

## 2. Required UI Regions

- Top bar:
  - back/home
  - project name
  - task search
  - `New Task`
  - board/list toggle
- Sidebar:
  - overview
  - milestones
  - labels
  - saved filters
  - history
- Main area:
  - filter bar
  - board columns (`Todo`, `Doing`, `Blocked`, `Done`) or list
- Detail drawer:
  - core fields
  - relations
  - activity log

---

## 3. Behavior Overrides

- Sidebar filter change updates main area immediately.
- Selecting task card opens drawer and highlights selected card.
- If filter hides selected task, drawer shows non-blocking warning and quick clear-filter action.
- Relation click in drawer scrolls and highlights target task in main area.

---

## 4. Task Card Compact Schema

Each task card should show:

- title
- status
- priority
- due date
- milestone tag
- relation badges (`P`, `C:n`, `B:n`, `BB:n`, `R!`, `R~`)

---

## 5. Test Hooks

- `data-testid="project-filter-sidebar"`
- `data-testid="project-task-board"`
- `data-testid="project-task-list"`
- `data-testid="project-task-card"`
- `data-testid="project-task-drawer"`
