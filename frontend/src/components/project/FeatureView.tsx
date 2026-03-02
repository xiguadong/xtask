import { useMemo } from 'react';
import { STATUS_LABELS, TASK_STATUSES } from '../../lib/constants';
import { buildFeatureGroups } from '../../lib/featureSelectors';
import { useTaskStore } from '../../stores/taskStore';

export function FeatureView() {
  const tasks = useTaskStore((state) => state.tasks);
  const labels = useTaskStore((state) => state.graph?.labels || []);
  const selectedTaskID = useTaskStore((state) => state.selectedTaskId);
  const setSelectedTaskID = useTaskStore((state) => state.setSelectedTaskId);
  const updateTask = useTaskStore((state) => state.updateTask);

  const groups = useMemo(() => buildFeatureGroups(tasks, labels), [tasks, labels]);

  return (
    <section className="space-y-3" data-testid="project-task-feature">
      {groups.map((group) => (
        <article key={group.id} className="rounded-lg border border-border bg-surface" data-testid="feature-group">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
            <h3 className="text-sm font-semibold text-text">{group.title}</h3>
            <div className="text-xs text-muted">
              {group.tasks.length} tasks · Todo {group.counts.todo} / Doing {group.counts.doing} / Blocked {group.counts.blocked} / Done {group.counts.done}
            </div>
          </header>

          <div className="space-y-1 p-3">
            {group.tasks.map((task) => (
              <div
                key={`${group.id}-${task.id}`}
                className={`grid gap-2 rounded-md border px-2 py-2 md:grid-cols-[minmax(0,1fr)_90px_100px_160px] ${
                  selectedTaskID === task.id ? 'border-primary bg-blue-50' : 'border-border bg-white'
                }`}
              >
                <button type="button" className="truncate text-left text-sm text-text hover:underline" onClick={() => setSelectedTaskID(task.id)}>
                  {task.title}
                </button>
                <span className="text-xs text-muted">{STATUS_LABELS[task.status]}</span>
                <span className="text-xs text-muted">{task.due_date || '-'}</span>
                <select
                  value={task.status}
                  aria-label={`Update status for ${task.title}`}
                  className="rounded border border-border bg-white px-2 py-1 text-xs"
                  onChange={(event) => void updateTask(task.id, { status: event.target.value as typeof task.status })}
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
