import { useMemo } from 'react';
import { PRIORITY_LABELS, STATUS_LABELS, TASK_STATUSES } from '../../lib/constants';
import { buildPlanSections } from '../../lib/planSelectors';
import { useTaskStore } from '../../stores/taskStore';

export function PlanView() {
  const tasks = useTaskStore((state) => state.tasks);
  const milestones = useTaskStore((state) => state.milestones);
  const relations = useTaskStore((state) => state.relations);
  const selectedTaskID = useTaskStore((state) => state.selectedTaskId);
  const setSelectedTaskID = useTaskStore((state) => state.setSelectedTaskId);
  const updateTask = useTaskStore((state) => state.updateTask);

  const sections = useMemo(() => buildPlanSections(tasks, milestones, relations), [tasks, milestones, relations]);

  return (
    <section className="space-y-3" data-testid="project-task-plan">
      {sections.map((section) => (
        <article key={section.id} className="rounded-lg border border-border bg-surface" data-testid="plan-section">
          <header className="border-b border-border px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-text">{section.title}</h3>
              <div className="text-xs text-muted">
                {section.dueDate ? `Due ${section.dueDate} · ` : ''}
                {section.done}/{section.total} done ({section.percent}%)
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-primary" style={{ width: `${section.percent}%` }} />
            </div>
          </header>

          <div className="space-y-2 p-3">
            {section.roots.length === 0 && <p className="text-xs text-muted">No tasks in this node.</p>}
            {section.roots.map((root) => (
              <div key={root.task.id} className="space-y-1">
                <div
                  className={`grid gap-2 rounded-md border px-2 py-2 md:grid-cols-[minmax(0,1fr)_100px_90px_160px] ${
                    selectedTaskID === root.task.id ? 'border-primary bg-blue-50' : 'border-border bg-white'
                  }`}
                  data-testid="plan-task-row"
                >
                  <button type="button" className="truncate text-left text-sm font-medium text-text hover:underline" onClick={() => setSelectedTaskID(root.task.id)}>
                    {root.task.title}
                  </button>
                  <span className="text-xs text-muted">{root.task.due_date || '-'}</span>
                  <span className="text-xs text-muted">{PRIORITY_LABELS[root.task.priority]}</span>
                  <select
                    value={root.task.status}
                    aria-label={`Update status for ${root.task.title}`}
                    className="rounded border border-border bg-white px-2 py-1 text-xs"
                    onChange={(event) => void updateTask(root.task.id, { status: event.target.value as typeof root.task.status })}
                  >
                    {TASK_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>

                {root.children.length > 0 && (
                  <div className="space-y-1 pl-4">
                    {root.children.map((child) => (
                      <div
                        key={child.task.id}
                        className={`grid gap-2 rounded-md border px-2 py-1.5 md:grid-cols-[minmax(0,1fr)_100px_90px_160px] ${
                          selectedTaskID === child.task.id ? 'border-primary bg-blue-50' : 'border-border bg-slate-50'
                        }`}
                        data-testid="plan-task-row"
                      >
                        <button type="button" className="truncate text-left text-xs text-text hover:underline" onClick={() => setSelectedTaskID(child.task.id)}>
                          {child.task.title}
                        </button>
                        <span className="text-xs text-muted">{child.task.due_date || '-'}</span>
                        <span className="text-xs text-muted">{PRIORITY_LABELS[child.task.priority]}</span>
                        <div className="flex items-center justify-between gap-1">
                          <select
                            value={child.task.status}
                            aria-label={`Update status for ${child.task.title}`}
                            className="w-full rounded border border-border bg-white px-2 py-1 text-xs"
                            onChange={(event) => void updateTask(child.task.id, { status: event.target.value as typeof child.task.status })}
                          >
                            {TASK_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                              </option>
                            ))}
                          </select>
                          {child.hiddenDescendants > 0 && <span className="whitespace-nowrap text-[11px] text-muted">+{child.hiddenDescendants} descendants</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
