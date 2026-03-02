import { useMemo } from 'react';
import { History, Tag } from 'lucide-react';
import { MilestoneList } from '../milestone/MilestoneList';
import { useTaskStore } from '../../stores/taskStore';

export function Sidebar({ home = false }: { home?: boolean }) {
  const graph = useTaskStore((state) => state.graph);
  const setFilter = useTaskStore((state) => state.setFilter);
  const clearFilters = useTaskStore((state) => state.clearFilters);

  const labels = useMemo(() => graph?.labels || [], [graph]);

  if (home) {
    return (
      <aside className="rounded-lg border border-border bg-surface p-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Navigation</h2>
        <p className="mt-2 text-xs text-muted">Select a project from status lanes.</p>
      </aside>
    );
  }

  return (
    <aside className="space-y-4 rounded-lg border border-border bg-surface p-3" data-testid="project-filter-sidebar">
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Overview</h2>
        <button type="button" onClick={clearFilters} className="w-full rounded border border-border px-2 py-1 text-left text-xs hover:bg-slate-100">
          Clear all filters
        </button>
      </section>

      <MilestoneList />

      <section className="space-y-2">
        <h3 className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
          <Tag className="h-3.5 w-3.5" /> Labels
        </h3>
        {labels.length === 0 && <p className="text-xs text-muted">No labels</p>}
        {labels.map((label) => (
          <button
            key={label.id}
            type="button"
            onClick={() => setFilter({ labels: label.id })}
            className="flex w-full items-center justify-between rounded border border-border px-2 py-1 text-xs hover:bg-slate-100"
          >
            <span>{label.name}</span>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
          </button>
        ))}
      </section>

      <section className="space-y-2">
        <h3 className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
          <History className="h-3.5 w-3.5" /> Saved Filters
        </h3>
        <button
          type="button"
          onClick={() => setFilter({ status: 'blocked' })}
          className="w-full rounded border border-border px-2 py-1 text-left text-xs hover:bg-slate-100"
        >
          Blocked tasks
        </button>
        <button
          type="button"
          onClick={() => setFilter({ priority: 'critical' })}
          className="w-full rounded border border-border px-2 py-1 text-left text-xs hover:bg-slate-100"
        >
          Critical priority
        </button>
      </section>
    </aside>
  );
}
