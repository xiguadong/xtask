import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Shell from '../components/layout/Shell';
import TopBar from '../components/layout/TopBar';
import { Task } from '../types';
import { assignAgent, fetchTask, updateTask } from '../utils/api';

export default function TaskDetailPage() {
  const { projectName, taskId } = useParams<{ projectName: string; taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [editing, setEditing] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    void loadTask();
  }, [projectName, taskId]);

  async function loadTask() {
    const data = await fetchTask(projectName!, taskId!);
    setTask(data);
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await updateTask(projectName!, taskId!, {
      status: data.get('status'),
      priority: data.get('priority'),
      milestone_id: data.get('milestone') || null,
      labels: task!.labels
    });
    setEditing(false);
    loadTask();
  }

  function handleAddLabel(event: React.FormEvent) {
    event.preventDefault();
    if (!newLabel.trim() || !task) return;
    if (task.labels.includes(newLabel.trim())) {
      setNewLabel('');
      return;
    }
    setTask({ ...task, labels: [...task.labels, newLabel.trim()] });
    setNewLabel('');
  }

  function handleRemoveLabel(label: string) {
    if (!task) return;
    setTask({ ...task, labels: task.labels.filter((l) => l !== label) });
  }

  async function handleAssignAgent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await assignAgent(projectName!, taskId!, {
      identity: data.get('agent'),
      branch: data.get('branch')
    });
    loadTask();
  }

  if (!task) {
    return (
      <>
        <TopBar title="Task Detail" backTo={`/projects/${projectName}`} backLabel="Back to project" searchPlaceholder="Search task" />
        <div className="mx-auto max-w-[1600px] p-6 text-sm text-muted">Loading task...</div>
      </>
    );
  }

  return (
    <>
      <TopBar title={task.title} backTo={`/projects/${projectName}`} backLabel="Back to project" searchPlaceholder="Search task" />

      <Shell
        sidebar={
          <aside className="space-y-3 rounded-lg border border-border bg-surface p-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Task Meta</h2>
            <div className="space-y-2 rounded-md border border-border bg-white p-3 text-xs">
              <p>
                <span className="text-muted">Status:</span> {task.status}
              </p>
              <p>
                <span className="text-muted">Priority:</span> {task.priority}
              </p>
              <p>
                <span className="text-muted">Creator:</span> {task.created_by}
              </p>
            </div>
            <div className="space-y-2 rounded-md border border-border bg-white p-3 text-xs">
              <h3 className="font-semibold text-text">Agent</h3>
              {task.agent.assigned ? (
                <>
                  <p>{task.agent.identity}</p>
                  <p className="text-muted">{task.agent.status}</p>
                  <p>{task.git.branch || 'No branch'}</p>
                </>
              ) : (
                <p className="text-muted">No agent assigned</p>
              )}
            </div>
          </aside>
        }
        main={
          <section className="space-y-3 rounded-lg border border-border bg-surface p-4">
            <header className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-semibold text-text">Task Details</h2>
                <p className="mt-1 text-xs text-muted">{task.id}</p>
              </div>
              <button
                onClick={() => setEditing((value) => !value)}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </header>

            {editing ? (
              <form onSubmit={handleUpdate} className="space-y-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <select name="status" defaultValue={task.status} className="w-full rounded border border-border bg-white p-2 text-sm">
                    <option value="todo">todo</option>
                    <option value="in_progress">in_progress</option>
                    <option value="done">done</option>
                    <option value="blocked">blocked</option>
                  </select>
                  <select name="priority" defaultValue={task.priority} className="w-full rounded border border-border bg-white p-2 text-sm">
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                    <option value="critical">critical</option>
                  </select>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Labels</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {task.labels.map((label) => (
                      <span key={label} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        {label}
                        <button
                          type="button"
                          onClick={() => handleRemoveLabel(label)}
                          className="text-slate-500 hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="flex-1 rounded border border-border bg-white p-2 text-sm"
                      placeholder="添加新标签"
                    />
                    <button
                      type="button"
                      onClick={handleAddLabel}
                      className="rounded bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                    >
                      添加
                    </button>
                  </div>
                </div>
                <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover">
                  Save
                </button>
              </form>
            ) : (
              <article className="space-y-4 text-sm">
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Description</h3>
                  <p className="text-text">{task.description || 'No description'}</p>
                </div>
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Labels</h3>
                  <div className="flex flex-wrap gap-2">
                    {task.labels.length > 0 ? (
                      task.labels.map((label) => (
                        <span key={label} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                          {label}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted">No labels</span>
                    )}
                  </div>
                </div>
              </article>
            )}

            <section className="space-y-3 border-t border-border pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Agent Assignment</h3>
              <form onSubmit={handleAssignAgent} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <input
                  name="agent"
                  placeholder="Agent identity"
                  defaultValue={task.agent.identity || 'claude-opus-4'}
                  className="rounded border border-border bg-white p-2 text-sm"
                />
                <input name="branch" placeholder="Git branch" className="rounded border border-border bg-white p-2 text-sm" />
                <button type="submit" className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover">
                  Assign
                </button>
              </form>
            </section>
          </section>
        }
      />
    </>
  );
}
