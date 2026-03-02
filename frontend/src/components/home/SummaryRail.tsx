import { Link } from 'react-router-dom';
import type { SummaryStats } from '../../lib/types';

export function SummaryRail({ summary }: { summary: SummaryStats }) {
  return (
    <aside className="space-y-3 rounded-lg border border-border bg-surface p-4" data-testid="home-summary-rail">
      <h3 className="text-sm font-semibold text-text">Summary</h3>
      <ul className="space-y-2 text-sm text-muted">
        <li>Total projects: {summary.total}</li>
        <li>Due this week: {summary.due_this_week}</li>
        <li>Blocked tasks total: {summary.blocked_total}</li>
      </ul>
      <div className="space-y-2 text-xs">
        <Link className="block rounded border border-border px-2 py-1 hover:border-primary" to="/?status=blocked">
          Open blocked projects
        </Link>
        <Link className="block rounded border border-border px-2 py-1 hover:border-primary" to="/?status=at_risk">
          Open at-risk projects
        </Link>
      </div>
    </aside>
  );
}
