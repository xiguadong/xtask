import { PriorityIcon } from '../shared/PriorityIcon';
import { StatusBadge } from '../shared/StatusBadge';
import { useTaskStore } from '../../stores/taskStore';

export function ListView() {
  const tasks = useTaskStore((state) => state.tasks);
  const selectedTaskId = useTaskStore((state) => state.selectedTaskId);
  const setSelectedTaskId = useTaskStore((state) => state.setSelectedTaskId);

  return (
    <section className="overflow-auto rounded-lg border border-border bg-surface" data-testid="project-task-list">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Priority</th>
            <th className="px-3 py-2">Due</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr
              key={task.id}
              className={`cursor-pointer border-t border-border hover:bg-slate-50 ${selectedTaskId === task.id ? 'bg-blue-50' : ''}`}
              onClick={() => setSelectedTaskId(task.id)}
            >
              <td className="px-3 py-2">{task.title}</td>
              <td className="px-3 py-2">
                <StatusBadge status={task.status} />
              </td>
              <td className="px-3 py-2">
                <PriorityIcon priority={task.priority} />
              </td>
              <td className="px-3 py-2 text-xs text-muted">{task.due_date || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
