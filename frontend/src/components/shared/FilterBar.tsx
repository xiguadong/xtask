import { Search, X } from 'lucide-react';
import { TASK_PRIORITIES, TASK_STATUSES } from '../../lib/constants';
import { useTaskStore } from '../../stores/taskStore';

export function FilterBar() {
  const filters = useTaskStore((state) => state.filters);
  const milestones = useTaskStore((state) => state.milestones);
  const setFilter = useTaskStore((state) => state.setFilter);
  const clearFilters = useTaskStore((state) => state.clearFilters);

  return (
    <section
      className="grid gap-2 rounded-md border border-border bg-surface p-3 md:grid-cols-[1fr_repeat(5,minmax(120px,1fr))_auto]"
      data-testid="task-filter-bar"
    >
      <label className="relative text-sm">
        <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted" aria-hidden="true" />
        <input
          aria-label="Search tasks"
          value={filters.q || ''}
          onChange={(event) => setFilter({ q: event.target.value || undefined })}
          className="w-full rounded-md border border-border bg-white py-2 pl-8 pr-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          placeholder="Search tasks"
        />
      </label>

      <select
        aria-label="Filter by status"
        className="rounded-md border border-border bg-white px-2 py-2 text-sm"
        value={filters.status || ''}
        onChange={(event) => setFilter({ status: event.target.value || undefined })}
      >
        <option value="">All status</option>
        {TASK_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by priority"
        className="rounded-md border border-border bg-white px-2 py-2 text-sm"
        value={filters.priority || ''}
        onChange={(event) => setFilter({ priority: event.target.value || undefined })}
      >
        <option value="">All priority</option>
        {TASK_PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by milestone"
        className="rounded-md border border-border bg-white px-2 py-2 text-sm"
        value={filters.milestone || ''}
        onChange={(event) => setFilter({ milestone: event.target.value || undefined })}
      >
        <option value="">All milestones</option>
        {milestones.map((ms) => (
          <option key={ms.id} value={ms.id}>
            {ms.title}
          </option>
        ))}
      </select>

      <input
        aria-label="Due before"
        type="date"
        className="rounded-md border border-border bg-white px-2 py-2 text-sm"
        value={filters.due_before || ''}
        onChange={(event) => setFilter({ due_before: event.target.value || undefined })}
      />

      <select
        aria-label="Blocked filter"
        className="rounded-md border border-border bg-white px-2 py-2 text-sm"
        value={filters.is_blocked || ''}
        onChange={(event) => setFilter({ is_blocked: event.target.value || undefined })}
      >
        <option value="">All blocked states</option>
        <option value="true">Blocked only</option>
        <option value="false">Unblocked only</option>
      </select>

      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-slate-100"
        onClick={clearFilters}
      >
        <X className="h-3 w-3" aria-hidden="true" />
        Clear
      </button>
    </section>
  );
}
