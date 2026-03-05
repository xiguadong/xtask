import { Link } from 'react-router-dom';
import { Task } from '../types';

const statusColors = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-primary/10 text-primary',
  done: 'bg-success/10 text-success',
  blocked: 'bg-danger/10 text-danger'
};

const priorityColors = {
  low: 'text-slate-500',
  medium: 'text-warning',
  high: 'text-primary',
  critical: 'text-danger'
};

export default function TaskCard({ task, projectName }: { task: Task; projectName: string }) {
  return (
    <Link
      to={`/projects/${projectName}/tasks/${task.id}`}
      className="block rounded-lg border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-text">{task.title}</h4>
        <span className={`text-xs px-2 py-1 rounded-md font-medium ${statusColors[task.status]}`}>
          {task.status}
        </span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className={`font-medium ${priorityColors[task.priority]}`}>{task.priority}</span>
        {task.git.branch && (
          <span className="text-xs text-green-600">🌿 {task.git.branch}</span>
        )}
        {task.labels.map(label => (
          <span key={label} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {label}
          </span>
        ))}
        {task.parent_tasks.length > 0 && (
          <span className="text-xs text-slate-400">子任务</span>
        )}
        {task.created_by === 'cli' && <span className="text-xs text-slate-400">CLI</span>}
      </div>
    </Link>
  );
}
