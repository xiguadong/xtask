import { Link } from 'react-router-dom';
import LabelBadge from './LabelBadge';
import { Task } from '../types';
import { formatTaskDateTime, formatTaskDisplayId, formatTaskPriority, formatTaskStatus } from '../utils/taskDisplay';

const statusColors = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-primary/10 text-primary',
  done: 'bg-success/10 text-success',
  completed: 'bg-success/10 text-success',
  blocked: 'bg-danger/10 text-danger'
};

const priorityColors = {
  low: 'border-slate-200 bg-slate-50 text-slate-600',
  medium: 'border-warning/30 bg-warning/10 text-warning',
  high: 'border-primary/30 bg-primary/10 text-primary',
  critical: 'border-danger/30 bg-danger/10 text-danger'
};

export default function TaskCard({ task, projectName, currentSearch = '' }: { task: Task; projectName: string; currentSearch?: string }) {
  const displayId = formatTaskDisplayId(task);

  return (
    <Link
      to={`/projects/${projectName}/tasks/${task.id}${currentSearch}`}
      className="block rounded-lg border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{displayId}</p>
          <h4 className="mt-1 text-base font-semibold text-text">{task.title}</h4>
        </div>
        <span className={`rounded-md px-2 py-1 text-xs font-medium ${statusColors[task.status]}`}>
          {formatTaskStatus(task.status)}
        </span>
      </div>

      <p className="mb-3 text-sm text-muted">{task.description?.trim() || '暂无描述'}</p>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full border px-2 py-1 font-medium ${priorityColors[task.priority]}`}>{formatTaskPriority(task.priority)}</span>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">创建于 {formatTaskDateTime(task.created_at)}</span>
        {task.git.branch && (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">分支 {task.git.branch}</span>
        )}
        {task.labels.map((label) => (
          <LabelBadge key={label} label={label} />
        ))}
        {task.parent_tasks.length > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">子任务</span>
        )}
        {task.created_by === 'cli' && <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-500">CLI</span>}
      </div>
    </Link>
  );
}
