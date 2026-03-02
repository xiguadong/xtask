# Design System Master File

> Scope: `xtask` project management web app
> Retrieval order: use `docs/design-system/xtask/pages/[page-name].md` first, then fallback to this file.
> Source: generated with `ui-ux-pro-max` and curated for GitHub-like engineering UX.

---

## 1. Product Context

- Product type: personal project management SaaS
- Information architecture: two-level pages
  - Level 1: Home Overview (all projects summary)
  - Level 2: Project Detail (single project tasks/relations)
- Visual direction: compact, high-density, engineering-first

---

## 2. Core Design Decisions

- Pattern: Data-Dense Dashboard (selected from style search)
- Interaction model: two-column main layout + on-demand detail drawer
- Icon system: Lucide only (no emoji icons)
- Motion: subtle, 150-250ms, no layout shift

---

## 3. Global Tokens

### 3.1 Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-bg` | `#F8FAFC` | App background |
| `--color-surface` | `#FFFFFF` | Cards, panels |
| `--color-text` | `#1E293B` | Primary text |
| `--color-muted` | `#475569` | Secondary text |
| `--color-border` | `#E2E8F0` | Borders/dividers |
| `--color-primary` | `#2563EB` | Links, active states |
| `--color-primary-hover` | `#1D4ED8` | Hover state |
| `--color-success` | `#22C55E` | Success/healthy |
| `--color-warning` | `#F59E0B` | At-risk warning |
| `--color-danger` | `#EF4444` | Blocked/error |

Notes:
- Prefer neutral base + blue actions + semantic status colors.
- Avoid purple-heavy palettes unless explicitly requested.

### 3.2 Typography

- Heading/UI font: `IBM Plex Sans`
- Body font: `IBM Plex Sans`
- Mono font: `JetBrains Mono` (IDs, code-like metadata, compact counters)

### 3.3 Spacing and Size

| Token | Value |
|---|---|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |

| Token | Value |
|---|---|
| `--radius-sm` | `6px` |
| `--radius-md` | `8px` |
| `--radius-lg` | `12px` |

### 3.4 Z-Index Scale

- `z-10`: sticky headers
- `z-20`: dropdown/filter popovers
- `z-30`: slide-up detail drawer
- `z-40`: modal
- `z-50`: blocking confirm dialog

Do not use arbitrary values like `z-[9999]`.

---

## 4. Component Baseline

### 4.1 Top Bar

- Contains context + primary actions, not dense metrics.
- Home: `Logo`, `Search Project`, `New Project`, `User Menu`
- Project detail: `Back/Home`, `Project Name`, `Search Task`, `New Task`, `View Toggle`, `User Menu`

### 4.2 Sidebar

- Reserved for navigation/filter scopes:
  - `Milestones`, `Labels`, `Saved Filters`, `History`
- Sidebar change must trigger main list refresh.

### 4.3 Main Area

- Board/List toggle with consistent filter bar
- Filter set: `status`, `priority`, `milestone`, `labels`, `due`, `blocked`

### 4.4 Detail Drawer

- Opens on task selection.
- Contains: core fields, relation list, activity timeline.
- Drawer updates must optimistically sync main card and sidebar counters.

---

## 5. Interaction and Accessibility Rules

- All primary actions keyboard reachable.
- Use `focus-visible:ring-2` on interactive controls.
- Never remove outline without replacement.
- Provide skip link on nav-heavy pages.
- Use semantic elements first (`button`, `a`, `label`), avoid clickable `div` unless fully keyboard-enabled.
- Use `aria-live="polite"` for async status updates.
- Decorative icons must set `aria-hidden="true"`.

---

## 6. State and Feedback Rules

- Loading: skeleton first, no blank pages.
- Empty: explain + next action button.
- Error: show reason + retry + context.
- Blocked state actions: when blocked rule prevents completion, show direct fix path.

---

## 7. Auto Self-Check Hooks (for UI/UX verification)

Recommended stable selectors:

- `data-testid="home-overview-board"`
- `data-testid="project-detail-board"`
- `data-testid="task-filter-bar"`
- `data-testid="task-detail-drawer"`
- `data-testid="new-task-button"`
- `data-testid="blocked-rule-alert"`

---

## 8. Anti-Patterns

- Emojis as UI icons
- Three-column always-on detail layout for task view
- Hover scale that changes layout
- Missing keyboard focus states
- Color-only status indication without text/icon backup

---

## 9. Pre-Delivery Checklist

- [ ] No emojis used as icons
- [ ] All clickable elements use pointer cursor and clear hover/focus states
- [ ] Keyboard navigation covers core flows
- [ ] Contrast >= 4.5:1 for main text
- [ ] Responsive tested at 390, 768, 1024, 1366
- [ ] Auto self-check pass rate >= 90%, critical flow pass rate = 100%
