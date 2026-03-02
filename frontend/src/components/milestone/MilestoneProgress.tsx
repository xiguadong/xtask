import type { MilestoneWithProgress } from '../../lib/types';

export function MilestoneProgress({ milestone }: { milestone: MilestoneWithProgress }) {
  return (
    <div className="rounded border border-border p-2 text-xs">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-medium text-text">{milestone.title}</span>
        <span className="font-mono text-muted">{milestone.progress.percent}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-primary" style={{ width: `${milestone.progress.percent}%` }} />
      </div>
      <div className="mt-1 text-muted">
        {milestone.progress.done}/{milestone.progress.total} done
      </div>
    </div>
  );
}
