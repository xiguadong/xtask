import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CalendarClock } from 'lucide-react';
import { PriorityIcon } from '../shared/PriorityIcon';
import { StatusBadge } from '../shared/StatusBadge';
import { RelationBadges } from './RelationBadges';
import type { Relation, Task } from '../../lib/types';

interface TaskCardProps {
  task: Task;
  relations: Relation[];
  selected: boolean;
  onClick: () => void;
}

export function TaskCard({ task, relations, selected, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`w-full rounded-lg border bg-white p-3 text-left shadow-sm transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        selected ? 'border-primary ring-1 ring-primary' : 'border-border'
      } ${isDragging ? 'opacity-60' : ''}`}
      data-testid="project-task-card"
      style={{ transform: CSS.Translate.toString(transform) }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-semibold text-text">{task.title}</p>
        <StatusBadge status={task.status} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <PriorityIcon priority={task.priority} />
        {task.due_date && (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3 w-3" aria-hidden="true" />
            {task.due_date}
          </span>
        )}
      </div>
      <RelationBadges taskId={task.id} relations={relations} />
    </button>
  );
}
