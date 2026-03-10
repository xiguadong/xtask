import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import LabelBadge from '../components/LabelBadge';
import Shell from '../components/layout/Shell';
import TopBar from '../components/layout/TopBar';
import TaskActions from '../components/TaskActions';
import MarkdownEditor from '../components/MarkdownEditor';
import MarkdownPreview from '../components/MarkdownPreview';
import TerminalOverviewFloating from '../components/TerminalOverviewFloating';
import { useMilestones } from '../hooks/useMilestones';
import { Task } from '../types';
import { normalizeTaskLabel, normalizeTaskLabels } from '../utils/taskLabels';
import { formatTaskDisplayId, formatTaskPriority, formatTaskStatus, normalizeTaskStatus } from '../utils/taskDisplay';
import { fetchTask, updateTask } from '../utils/api';

export default function TaskDetailPage() {
  const { projectName, taskId } = useParams<{ projectName: string; taskId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { milestones, loading: milestonesLoading } = useMilestones(projectName!);
  const [task, setTask] = useState<Task | null>(null);
  const [editing, setEditing] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const backTo = useMemo(() => `/projects/${projectName}${location.search || '?view=tasks'}`, [location.search, projectName]);

  useEffect(() => {
    void loadTask();
  }, [projectName, taskId]);

  useEffect(() => {
    if (!task || !editing) return;
    setDescriptionDraft(task.description_content || task.description || '');
  }, [editing, task]);

  useEffect(() => {
    if (!projectName || !taskId || editing) return;
    const timer = window.setInterval(() => {
      void loadTask();
    }, 180000);

    return () => window.clearInterval(timer);
  }, [editing, projectName, taskId]);

  async function loadTask() {
    const data = await fetchTask(projectName!, taskId!);
    setTask({
      ...data,
      labels: normalizeTaskLabels(data.labels || [])
    });
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await updateTask(projectName!, taskId!, {
      status: data.get('status'),
      priority: data.get('priority'),
      description: data.get('description'),
      milestone_id: data.get('milestone') || null,
      labels: task!.labels
    });
    setEditing(false);
    void loadTask();
  }

  function handleAddLabel(event: React.FormEvent) {
    event.preventDefault();
    const normalizedLabel = normalizeTaskLabel(newLabel);
    if (!normalizedLabel || !task) return;
    if (task.labels.includes(normalizedLabel)) {
      setNewLabel('');
      return;
    }
    setTask({ ...task, labels: normalizeTaskLabels([...task.labels, normalizedLabel]) });
    setNewLabel('');
  }

  function handleRemoveLabel(label: string) {
    if (!task) return;
    setTask({ ...task, labels: task.labels.filter((l) => l !== label) });
  }

  if (!task) {
    return (
      <>
        <TopBar title="Task Detail" backTo={backTo} backLabel="返回任务列表" searchPlaceholder="Search task" />
        <div className="mx-auto max-w-[1600px] p-6 text-sm text-muted">Loading task...</div>
      </>
    );
  }

  const descriptionContent = task.description_content || task.description;
  const normalizedTaskStatus = normalizeTaskStatus(task.status);

  async function handleTaskDeleted() {
    navigate(backTo);
  }

  return (
    <>
      <TopBar title={task.title} backTo={backTo} backLabel="返回任务列表" searchPlaceholder="Search task" />

      <Shell
        sidebar={
          <aside className="space-y-3 rounded-lg border border-border bg-surface p-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Task Meta</h2>
            <div className="space-y-2 rounded-md border border-border bg-white p-3 text-xs">
              <p>
                <span className="text-muted">状态：</span> {formatTaskStatus(task.status)}
              </p>
              <p>
                <span className="text-muted">优先级：</span> {formatTaskPriority(task.priority)}
              </p>
              <p>
                <span className="text-muted">创建来源：</span> {task.created_by}
              </p>
            </div>
          </aside>
        }
        main={
          <section className="space-y-4 rounded-lg border border-border bg-surface p-4">
            <header className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-semibold text-text">任务详情</h2>
                <p className="mt-1 text-xs text-muted">{formatTaskDisplayId(task)}</p>
                <p className="mt-1 text-[11px] text-muted">原始 ID：{task.id}</p>
              </div>
              <button
                onClick={() => setEditing((value) => !value)}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
              >
                {editing ? '取消' : '编辑'}
              </button>
            </header>

            {editing ? (
              <form onSubmit={handleUpdate} className="space-y-3">
                <div className="grid gap-2 md:grid-cols-3">
                  <select name="status" defaultValue={normalizedTaskStatus} className="w-full rounded border border-border bg-white p-2 text-sm">
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
                  <select
                    name="milestone"
                    defaultValue={task.milestone_id || ''}
                    className="w-full rounded border border-border bg-white p-2 text-sm"
                    disabled={milestonesLoading}
                  >
                    <option value="">无里程碑</option>
                    {milestones.map((milestone) => (
                      <option key={milestone.id} value={milestone.id}>
                        {milestone.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Labels</h3>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {task.labels.map((label) => (
                      <div key={label} className="inline-flex items-center gap-1 rounded-full border border-border bg-white pr-2 shadow-sm">
                        <LabelBadge label={label} />
                        <button type="button" onClick={() => handleRemoveLabel(label)} className="text-slate-500 hover:text-red-600">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value.toLowerCase())}
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
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Description</h3>
                  <MarkdownEditor
                    name="description"
                    value={descriptionDraft}
                    onChange={setDescriptionDraft}
                    placeholder="支持 Markdown：标题、列表、代码块、链接、引用..."
                  />
                </div>
                <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover">
                  保存
                </button>
              </form>
            ) : (
              <>
                <article className="space-y-4 text-sm">
                  <div className="rounded-lg border border-border bg-white p-4">
                    <div className="mb-3 border-b border-border pb-3">
                      <h3 className="text-sm font-semibold text-text">任务描述</h3>
                      {task.description_file ? (
                        <p className="mt-1 text-xs text-muted">
                          长描述已自动收纳到 <code>{task.description_file}</code>
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-muted">任务正文按统一紧凑 Markdown 规则渲染。</p>
                      )}
                    </div>
                    {descriptionContent?.trim() ? (
                      <MarkdownPreview value={descriptionContent} className="text-sm" compact />
                    ) : (
                      <p className="text-sm text-muted">暂无描述</p>
                    )}
                  </div>

                  <div className="rounded-lg border border-border bg-white p-4">
                    <div className="mb-3 border-b border-border pb-3">
                      <h3 className="text-sm font-semibold text-text">标签</h3>
                      <p className="mt-1 text-xs text-muted">任务附加属性与分类标识。</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {task.labels.length > 0 ? (
                        task.labels.map((label) => <LabelBadge key={label} label={label} />)
                      ) : (
                        <span className="text-muted">No labels</span>
                      )}
                    </div>
                  </div>
                </article>

                <TaskActions task={task} projectName={projectName!} onUpdate={loadTask} onDeleted={handleTaskDeleted} />

                {task.summary_content?.trim() ? (
                  <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
                    <div className="mb-3 border-b border-border pb-3">
                      <h3 className="text-sm font-semibold text-text">任务总结</h3>
                      <p className="mt-1 text-xs text-muted">与任务描述相同，按统一紧凑 Markdown 规则渲染。</p>
                      {task.summary_file ? (
                        <p className="mt-1 text-xs text-muted">
                          总结文件：<code>{task.summary_file}</code>
                        </p>
                      ) : null}
                    </div>
                    <MarkdownPreview value={task.summary_content} className="text-sm" compact />
                  </section>
                ) : null}
              </>
            )}
          </section>
        }
      />
      {projectName && <TerminalOverviewFloating projectName={projectName} showConfig={false} defaultExpanded={false} />}
    </>
  );
}
