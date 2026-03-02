import { AlertOctagon, ArrowUpCircle, Circle, TriangleAlert } from 'lucide-react';
import type { TaskPriority } from '../../lib/types';

const iconMap = {
  critical: <AlertOctagon className="h-4 w-4 text-danger" aria-hidden="true" />,
  high: <TriangleAlert className="h-4 w-4 text-warning" aria-hidden="true" />,
  medium: <ArrowUpCircle className="h-4 w-4 text-primary" aria-hidden="true" />,
  low: <Circle className="h-4 w-4 text-muted" aria-hidden="true" />,
} as const;

export function PriorityIcon({ priority }: { priority: TaskPriority }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted">
      {iconMap[priority]}
      <span>{priority}</span>
    </span>
  );
}
