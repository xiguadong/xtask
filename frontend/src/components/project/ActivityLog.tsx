import type { HistoryEntry } from '../../lib/types';

export function ActivityLog({ entries }: { entries: HistoryEntry[] }) {
  return (
    <section className="space-y-2" aria-label="Activity log">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Activity</h4>
      {entries.length === 0 && <p className="text-xs text-muted">No activity yet.</p>}
      <ul className="max-h-40 space-y-2 overflow-auto pr-1 text-xs">
        {entries.map((entry, index) => (
          <li key={`${entry.timestamp}-${index}`} className="rounded border border-border p-2">
            <p className="font-mono text-[10px] text-muted">{new Date(entry.timestamp).toLocaleString()}</p>
            <p className="text-text">
              {entry.field}: <span className="text-muted">{entry.old_value || '∅'}</span> {'->'} {entry.new_value || '∅'}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
