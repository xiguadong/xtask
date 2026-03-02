import type { Relation } from '../../lib/types';

interface RelationListProps {
  relations: Relation[];
  taskId: string;
  onDelete: (relationId: string) => void;
  onFocusTask: (taskId: string) => void;
}

export function RelationList({ relations, taskId, onDelete, onFocusTask }: RelationListProps) {
  const related = relations.filter((rel) => rel.source_id === taskId || rel.target_id === taskId);

  return (
    <section className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Relations</h4>
      {related.length === 0 && <p className="text-xs text-muted">No relations.</p>}
      {related.map((rel) => {
        const target = rel.source_id === taskId ? rel.target_id : rel.source_id;
        return (
          <div key={rel.id} className="flex items-center justify-between gap-2 rounded border border-border p-2 text-xs">
            <button
              type="button"
              className="font-mono text-primary hover:underline"
              onClick={() => onFocusTask(target)}
            >
              {rel.type}: {rel.source_id} {'->'} {rel.target_id}
            </button>
            <button
              type="button"
              className="rounded border border-border px-2 py-1 hover:bg-slate-100"
              onClick={() => onDelete(rel.id)}
            >
              remove
            </button>
          </div>
        );
      })}
    </section>
  );
}
