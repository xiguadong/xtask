import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TaskList from '../components/TaskList';
import MilestoneList from '../components/MilestoneList';
import { WorktreeList } from '../components/WorktreeList';
import Shell from '../components/layout/Shell';
import TopBar from '../components/layout/TopBar';
import { useTasks } from '../hooks/useTasks';
import { useMilestones } from '../hooks/useMilestones';
import { useWorktrees } from '../hooks/useWorktrees';
import { useTerminal } from '../hooks/useTerminal';
import { createMilestone, createTask, deleteMilestone, updateMilestone } from '../utils/api';
import { Milestone, Task, TerminalOverview } from '../types';

export default function ProjectDetailPage() {
  const { projectName } = useParams<{ projectName: string }>();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'tasks' | 'worktrees'>('tasks');
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [maxTerminalsDraft, setMaxTerminalsDraft] = useState(3);
  const [terminalConfigSaving, setTerminalConfigSaving] = useState(false);
  const [terminalConfigError, setTerminalConfigError] = useState<string | null>(null);
  const [terminalOverview, setTerminalOverview] = useState<TerminalOverview>({
    config: { max_terminals: 3 },
    counts: { total: 0, working: 0, waiting: 0, max: 3, available: 3 },
    items: []
  });

  const filters = activeTab === 'all' ? {} : activeTab === 'uncategorized' ? { milestone: 'null' } : { milestone: activeTab };
  const { tasks, refresh: refreshTasks } = useTasks(projectName!, filters);
  const { milestones, refresh: refreshMilestones } = useMilestones(projectName!);
  const { worktrees, createWorktree, deleteWorktree } = useWorktrees(projectName!);
  const { getOverview: fetchTerminalOverview, updateProjectConfig } = useTerminal(projectName!);

  const allLabels = useMemo(() => Array.from(new Set(tasks.flatMap((task) => task.labels))), [tasks]);
  const filteredTasks = selectedLabel ? tasks.filter((task) => task.labels.includes(selectedLabel)) : tasks;

  const currentMilestoneLabel = useMemo(() => {
    if (activeTab === 'all') return '全部任务';
    if (activeTab === 'uncategorized') return '未归类';

    const current = milestones.find((milestone) => milestone.id === activeTab);
    return current ? current.name : '未知里程碑';
  }, [activeTab, milestones]);

  const taskProgressSummary = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter((task) => task.status === 'done').length;
    const todo = filteredTasks.filter((task) => task.status === 'todo').length;
    const inProgress = filteredTasks.filter((task) => task.status === 'in_progress').length;
    const blocked = filteredTasks.filter((task) => task.status === 'blocked').length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    return { total, done, todo, inProgress, blocked, percent };
  }, [filteredTasks]);

  const subtaskProgressList = useMemo(() => {
    const childrenByParent = new Map<string, Task[]>();

    filteredTasks.forEach((task) => {
      task.parent_tasks.forEach((parentId) => {
        const children = childrenByParent.get(parentId) || [];
        children.push(task);
        childrenByParent.set(parentId, children);
      });
    });

    return filteredTasks
      .map((task) => {
        const subtasks = childrenByParent.get(task.id) || [];
        if (subtasks.length === 0) return null;

        const done = subtasks.filter((subtask) => subtask.status === 'done').length;
        const percent = Math.round((done / subtasks.length) * 100);

        return {
          id: task.id,
          title: task.title,
          done,
          total: subtasks.length,
          percent
        };
      })
      .filter(
        (
          item
        ): item is {
          id: string;
          title: string;
          done: number;
          total: number;
          percent: number;
        } => Boolean(item)
      );
  }, [filteredTasks]);

  useEffect(() => {
    let active = true;

    const loadTerminalOverview = async () => {
      try {
        const data = await fetchTerminalOverview();
        if (!active) return;
        setTerminalOverview(data);
        setMaxTerminalsDraft(data?.config?.max_terminals || 3);
      } catch {
        if (!active) return;
        setTerminalOverview({
          config: { max_terminals: 3 },
          counts: { total: 0, working: 0, waiting: 0, max: 3, available: 3 },
          items: []
        });
      }
    };

    void loadTerminalOverview();
    const timer = setInterval(loadTerminalOverview, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [fetchTerminalOverview]);

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await createTask(projectName!, {
      title: data.get('title'),
      description: data.get('description'),
      priority: data.get('priority'),
      milestone_id: data.get('milestone') || null,
      labels: (data.get('labels') as string)?.split(',').map((label) => label.trim()).filter(Boolean) || []
    });
    setShowTaskForm(false);
    form.reset();
    refreshTasks();
  }

  async function handleCreateMilestone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const goals = (data.get('goals') as string)
      ?.split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((title) => ({ title, done: false })) || [];

    await createMilestone(projectName!, {
      name: data.get('name'),
      description: data.get('description'),
      due_date: data.get('due_date') || null,
      goals
    });

    setShowMilestoneForm(false);
    form.reset();
    refreshMilestones();
  }

  async function handleUpdateMilestone(id: string, updates: Partial<Milestone>) {
    await updateMilestone(projectName!, id, updates);
    refreshMilestones();
  }

  async function handleDeleteMilestone(id: string) {
    await deleteMilestone(projectName!, id);
    if (activeTab === id) {
      setActiveTab('all');
    }
    refreshMilestones();
    refreshTasks();
  }

  function refreshAll() {
    refreshTasks();
    refreshMilestones();
    void fetchTerminalOverview().then(setTerminalOverview).catch(() => undefined);
  }

  async function handleSaveTerminalConfig() {
    try {
      setTerminalConfigSaving(true);
      setTerminalConfigError(null);
      await updateProjectConfig({
        max_terminals: Math.max(1, Math.min(20, maxTerminalsDraft || 1))
      });

      const data = await fetchTerminalOverview();
      setTerminalOverview(data);
      setMaxTerminalsDraft(data?.config?.max_terminals || 3);
    } catch (err: any) {
      setTerminalConfigError(err?.message || '保存终端上限失败');
    } finally {
      setTerminalConfigSaving(false);
    }
  }

  return (
    <>
      <TopBar
        title={projectName || 'Project'}
        backTo="/"
        backLabel="首页"
        searchPlaceholder="搜索任务"
        rightSlot={
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('tasks')}
              className={`px-3 py-1 text-xs rounded ${viewMode === 'tasks' ? 'bg-primary text-white' : 'bg-gray-200'}`}
            >
              任务
            </button>
            <button
              onClick={() => setViewMode('worktrees')}
              className={`px-3 py-1 text-xs rounded ${viewMode === 'worktrees' ? 'bg-primary text-white' : 'bg-gray-200'}`}
            >
              Worktrees
            </button>
            <button onClick={refreshAll} className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white hover:bg-primary-hover">
              刷新
            </button>
          </div>
        }
      />

      <Shell
        sidebar={
          <aside className="space-y-3 rounded-lg border border-border bg-surface p-3">
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">TASK PROGRESS</h2>
              <p className="text-xs text-muted">当前筛选：{currentMilestoneLabel}</p>
              <div className="flex items-end justify-between rounded border border-border bg-white p-2">
                <p className="text-sm font-semibold text-text">
                  {taskProgressSummary.done}/{taskProgressSummary.total}
                </p>
                <p className="text-xs font-medium text-primary">{taskProgressSummary.percent}%</p>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-200"
                  style={{ width: `${taskProgressSummary.percent}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border border-border bg-white p-2">
                  <p className="text-muted">Todo</p>
                  <p className="font-semibold text-text">{taskProgressSummary.todo}</p>
                </div>
                <div className="rounded border border-border bg-white p-2">
                  <p className="text-muted">In Progress</p>
                  <p className="font-semibold text-text">{taskProgressSummary.inProgress}</p>
                </div>
                <div className="rounded border border-border bg-white p-2">
                  <p className="text-muted">Done</p>
                  <p className="font-semibold text-text">{taskProgressSummary.done}</p>
                </div>
                <div className="rounded border border-border bg-white p-2">
                  <p className="text-muted">Blocked</p>
                  <p className="font-semibold text-text">{taskProgressSummary.blocked}</p>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">MILESTONE FILTER</h3>
              <button
                onClick={() => setActiveTab('all')}
                className={`w-full rounded border px-2 py-1 text-left text-xs ${
                  activeTab === 'all' ? 'border-primary bg-primary text-white' : 'border-border bg-white hover:bg-slate-100'
                }`}
              >
                全部任务
              </button>
              {milestones.map((milestone) => (
                <button
                  key={milestone.id}
                  onClick={() => setActiveTab(milestone.id)}
                  className={`w-full rounded border px-2 py-1 text-left text-xs ${
                    activeTab === milestone.id ? 'border-primary bg-primary text-white' : 'border-border bg-white hover:bg-slate-100'
                  }`}
                >
                  {milestone.name}
                </button>
              ))}
              <button
                onClick={() => setActiveTab('uncategorized')}
                className={`w-full rounded border px-2 py-1 text-left text-xs ${
                  activeTab === 'uncategorized'
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-white hover:bg-slate-100'
                }`}
              >
                未归类
              </button>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Label Filter</h3>
              <select
                value={selectedLabel}
                onChange={(event) => setSelectedLabel(event.target.value)}
                className="w-full rounded border border-border bg-white p-2 text-xs"
              >
                <option value="">All labels</option>
                {allLabels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </section>
          </aside>
        }
        main={
          viewMode === 'worktrees' ? (
            <section className="space-y-3 rounded-lg border border-border bg-surface p-4">
              <WorktreeList worktrees={worktrees} onDelete={deleteWorktree} onCreate={createWorktree} />
            </section>
          ) : (
          <section className="space-y-3" data-testid="project-detail-board">
            <section className="space-y-3 rounded-lg border border-border bg-surface p-4">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-text">Milestones</h2>
                  <p className="mt-1 text-xs text-muted">从左到右查看里程碑，目标默认展示 5 条可视高度，超出可滚动。</p>
                </div>
                <button
                  onClick={() => setShowMilestoneForm((value) => !value)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-slate-100"
                >
                  {showMilestoneForm ? '关闭' : '新增里程碑'}
                </button>
              </header>

              {showMilestoneForm && (
                <form onSubmit={handleCreateMilestone} className="space-y-2 rounded-md border border-border bg-white p-3">
                  <input
                    name="name"
                    placeholder="里程碑名称"
                    required
                    className="w-full rounded border border-border p-2 text-xs"
                  />
                  <input name="description" placeholder="描述" className="w-full rounded border border-border p-2 text-xs" />
                  <input name="due_date" type="date" className="w-full rounded border border-border p-2 text-xs" />
                  <textarea
                    name="goals"
                    rows={4}
                    placeholder="目标清单（每行一个）\n例如：\n完成接口联调\n补齐测试用例"
                    className="w-full rounded border border-border p-2 text-xs"
                  />
                  <button type="submit" className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover">
                    创建
                  </button>
                </form>
              )}

              <MilestoneList
                milestones={milestones}
                activeTab={activeTab}
                onUpdate={handleUpdateMilestone}
                onDelete={handleDeleteMilestone}
              />
            </section>

            <header className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
              <div>
                <h2 className="text-sm font-semibold text-text">Tasks</h2>
                <p className="mt-1 text-xs text-muted">当前筛选：{currentMilestoneLabel}</p>
              </div>
              <button
                onClick={() => setShowTaskForm((value) => !value)}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
              >
                {showTaskForm ? '关闭' : '新建任务'}
              </button>
            </header>

            {showTaskForm && (
              <form onSubmit={handleCreateTask} className="space-y-3 rounded-lg border border-border bg-surface p-4">
                <input
                  name="title"
                  placeholder="标题"
                  required
                  className="w-full rounded border border-border bg-white p-2 text-sm"
                />
                <textarea
                  name="description"
                  placeholder="描述"
                  className="w-full rounded border border-border bg-white p-2 text-sm"
                  rows={3}
                />
                <div className="grid gap-2 md:grid-cols-2">
                  <select name="priority" className="w-full rounded border border-border bg-white p-2 text-sm">
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                    <option value="critical">critical</option>
                  </select>
                  <select name="milestone" className="w-full rounded border border-border bg-white p-2 text-sm">
                    <option value="">No milestone</option>
                    {milestones.map((milestone) => (
                      <option key={milestone.id} value={milestone.id}>
                        {milestone.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  name="labels"
                  placeholder="Labels (comma separated)"
                  className="w-full rounded border border-border bg-white p-2 text-sm"
                />
                <div className="flex gap-2">
                  <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover">
                    创建
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTaskForm(false)}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-slate-100"
                  >
                    取消
                  </button>
                </div>
              </form>
            )}

            <TaskList tasks={filteredTasks} projectName={projectName!} />
          </section>
          )
        }
        rail={
          <aside className="space-y-3 rounded-lg border border-border bg-surface p-3">
            <section className="space-y-2 rounded-md border border-border bg-white p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">TERMINAL OVERVIEW</h3>
              <div className="rounded border border-border bg-slate-50 p-2">
                <p className="text-xs text-muted">最大终端数</p>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={maxTerminalsDraft}
                    onChange={(event) => setMaxTerminalsDraft(Number(event.target.value) || 1)}
                    className="w-20 rounded border border-border bg-white px-2 py-1 text-xs text-text"
                  />
                  <button
                    onClick={handleSaveTerminalConfig}
                    disabled={terminalConfigSaving}
                    className="rounded border border-border bg-white px-2 py-1 text-xs font-semibold text-muted hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {terminalConfigSaving ? '保存中...' : '保存'}
                  </button>
                </div>
                {terminalConfigError && <p className="mt-1 text-[11px] text-red-600">{terminalConfigError}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border border-green-100 bg-green-50 p-2">
                  <p className="text-green-700">工作中</p>
                  <p className="text-base font-semibold text-green-700">{terminalOverview.counts.working}</p>
                </div>
                <div className="rounded border border-amber-100 bg-amber-50 p-2">
                  <p className="text-amber-700">等待中</p>
                  <p className="text-base font-semibold text-amber-700">{terminalOverview.counts.waiting}</p>
                </div>
              </div>
              <p className="text-xs text-muted">
                当前活跃终端总数：{terminalOverview.counts.total} / {terminalOverview.counts.max}（可用 {terminalOverview.counts.available}）
              </p>
              {terminalOverview.items.length === 0 ? (
                <p className="rounded border border-dashed border-border p-3 text-xs text-muted">暂无任务终端在运行</p>
              ) : (
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {terminalOverview.items.map((item) => (
                    <Link
                      key={item.sessionId}
                      to={`/projects/${projectName}/tasks/${item.taskId}`}
                      className="block rounded border border-border bg-slate-50 p-2 transition-colors hover:bg-slate-100"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-1 text-xs font-medium text-text">{item.taskTitle}</p>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            item.runtimeStatus === 'working' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.runtimeStatus === 'working' ? '工作中' : '等待'}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted">{item.taskId}</p>
                      <p className="text-[11px] text-muted">{item.mode === 'ssh' ? 'SSH' : '本地'} | 最后活动 {new Date(item.lastActiveAt).toLocaleTimeString()}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2 rounded-md border border-border bg-white p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">SUBTASK STATUS</h3>
              {subtaskProgressList.length === 0 ? (
                <p className="rounded border border-dashed border-border p-3 text-xs text-muted">当前筛选下暂无子任务完成状态</p>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {subtaskProgressList.map((item) => (
                    <div key={item.id} className="rounded border border-border bg-slate-50 p-2">
                      <div className="flex items-start justify-between gap-2 text-xs">
                        <p className="font-medium text-text">{item.title}</p>
                        <p className="text-muted">
                          {item.done}/{item.total}
                        </p>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                        <div className="h-1.5 rounded-full bg-success transition-all duration-200" style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        }
      />
    </>
  );
}
