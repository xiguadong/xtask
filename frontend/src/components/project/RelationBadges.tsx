import { buildRelationBadges } from '../../hooks/useTaskRelations';
import type { Relation } from '../../lib/types';

export function RelationBadges({ taskId, relations }: { taskId: string; relations: Relation[] }) {
  const badge = buildRelationBadges(taskId, relations);

  return (
    <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-mono text-muted">
      {badge.parent && <span className="rounded bg-slate-100 px-1 py-0.5">P</span>}
      {badge.children > 0 && <span className="rounded bg-slate-100 px-1 py-0.5">C:{badge.children}</span>}
      {badge.blockers > 0 && <span className="rounded bg-slate-100 px-1 py-0.5">B:{badge.blockers}</span>}
      {badge.blockedBy > 0 && <span className="rounded bg-red-100 px-1 py-0.5 text-red-700">BB:{badge.blockedBy}</span>}
      {badge.relatedStrong > 0 && <span className="rounded bg-blue-100 px-1 py-0.5 text-blue-700">R!</span>}
      {badge.relatedWeak > 0 && <span className="rounded bg-blue-50 px-1 py-0.5 text-blue-600">R~</span>}
    </div>
  );
}
