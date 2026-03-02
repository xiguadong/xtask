import { useDroppable } from '@dnd-kit/core';
import type { Task, TaskStatus, Relation } from '../../lib/types';
import { STATUS_LABELS } from '../../lib/constants';
import { TaskCard } from './TaskCard';

interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  relations: Relation[];
  selectedTaskId: string;
  onSelectTask: (taskId: string) => void;
}

export function BoardColumn({ status, tasks, relations, selectedTaskId, onSelectTask }: BoardColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: `column:${status}` });

  return (
    <section
      ref={setNodeRef}
      className={`rounded-lg border bg-slate-50 p-3 ${isOver ? 'border-primary' : 'border-border'}`}
      aria-label={`${STATUS_LABELS[status]} column`}
    >
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{STATUS_LABELS[status]}</h3>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{tasks.length}</span>
      </header>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            relations={relations}
            selected={selectedTaskId === task.id}
            onClick={() => onSelectTask(task.id)}
          />
        ))}
      </div>
    </section>
  );
}
