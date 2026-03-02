# Home Page Overrides

> Project: xtask
> Page: level-1 overview
> This file overrides `docs/design-system/xtask/MASTER.md` only where explicitly stated.

---

## 1. Layout Overrides

- Target layout: `left sidebar + main overview + compact summary rail`
- Default desktop split:
  - sidebar: 240px
  - main: flexible
  - summary rail: 280px
- Mobile: single column with collapsible filters

---

## 2. Information Priority

Home must answer in 5 seconds:

1. Which projects are healthy / at risk / blocked?
2. Which milestones are due soon?
3. What should I open next?

---

## 3. Components Specific to Home

- `Project Status Lanes`: `Healthy`, `At Risk`, `Blocked`
- `Project Card` (one per project):
  - title
  - active milestone
  - progress (%)
  - blocked count
  - due badge
- `Summary Rail`:
  - total projects
  - due this week
  - blocked tasks total
  - quick open links

---

## 4. Interaction Overrides

- Clicking a project card opens project detail page.
- Clicking a lane header applies status filter immediately.
- Summary rail links should deep-link to filtered project detail views.

---

## 5. Test Hooks

- `data-testid="home-status-lanes"`
- `data-testid="home-project-card"`
- `data-testid="home-summary-rail"`
