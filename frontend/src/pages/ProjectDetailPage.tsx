import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import LabelBadge from '../components/LabelBadge';
import MilestoneList from '../components/MilestoneList';
import TaskList from '../components/TaskList';
import TerminalOverviewFloating from '../components/TerminalOverviewFloating';
import { WorktreeList } from '../components/WorktreeList';
import ProjectDiscussionContent from '../components/discussion/ProjectDiscussionContent';
import Shell from '../components/layout/Shell';
import TopBar from '../components/layout/TopBar';
import { useDiscussions } from '../hooks/useDiscussions';
import { useMilestones } from '../hooks/useMilestones';
import { useTasks } from '../hooks/useTasks';
import { useWorktrees } from '../hooks/useWorktrees';
import { Milestone, Task } from '../types';
import { createMilestone, createTask, deleteMilestone, updateMilestone } from '../utils/api';
import { normalizeTaskLabel, normalizeTaskLabels } from '../utils/taskLabels';
import { TaskSortDirection, TaskSortField, compareTasks, formatTaskPriority, formatTaskStatus, isTaskCompleted } from '../utils/taskDisplay';

type ProjectView = 'milestones' | 'tasks' | 'worktrees' | 'discussion';

const ALL_MILESTONES = 'all';
const NO_MILESTONE = '__none__';
const ALL_STATUSES = 'all';
const COMPLETED_FILTER = '__completed__';

function isTaskSortField(value: string | null): value is TaskSortField {
  return value === 'priority' || value === 'created_at' || value === 'title';
}

function isTaskSortDirection(value: string | null): value is TaskSortDirection {
  return value === 'asc' || value === 'desc';
}

function isTaskStatusFilter(value: string | null): value is string {
  return value === ALL_STATUSES || value === COMPLETED_FILTER || value === 'todo' || value === 'in_progress' || value === 'blocked' || value === 'done';
}

function parseProjectDetailSearch(searchParams: URLSearchParams) {
  return {
    projectView: isProjectView(searchParams.get('view')) ? searchParams.get('view') : 'milestones',
    selectedDiscussionId: searchParams.get('discussion') || '',
    taskMilestoneFilter: searchParams.get('milestone') || ALL_MILESTONES,
    taskStatusFilter: isTaskStatusFilter(searchParams.get('status')) ? searchParams.get('status')! : ALL_STATUSES,
    taskLabelFilters: normalizeTaskLabels((searchParams.get('labels') || '').split(',')),
    taskSortField: isTaskSortField(searchParams.get('sortField')) ? searchParams.get('sortField')! : 'priority',
    taskSortDirection: isTaskSortDirection(searchParams.get('sortDir')) ? searchParams.get('sortDir')! : 'asc'
  };
}

function isProjectView(value: string | null): value is ProjectView {
  return value === 'milestones' || value === 'tasks' || value === 'worktrees' || value === 'discussion';
}

function buildTaskSummary(tasks: Task[]) {
  const total = tasks.length;
  const done = tasks.filter((task) => isTaskCompleted(task.status)).length;
  const todo = tasks.filter((task) => task.status === 'todo').length;
  const inProgress = tasks.filter((task) => task.status === 'in_progress').length;
  const blocked = tasks.filter((task) => task.status === 'blocked').length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return { total, done, todo, inProgress, blocked, percent };
}

export default function ProjectDetailPage() {
  const { projectName } = useParams<{ projectName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedSearchState = useMemo(() => parseProjectDetailSearch(searchParams), [searchParams]);
  const { projectView, selectedDiscussionId, taskMilestoneFilter, taskStatusFilter, taskLabelFilters, taskSortField, taskSortDirection } = parsedSearchState;
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);

  const { tasks, loading: tasksLoading, refresh: refreshTasks } = useTasks(projectName!);
  const { milestones, loading: milestonesLoading, refresh: refreshMilestones } = useMilestones(projectName!);
  const { worktrees, loading: worktreesLoading, refresh: refreshWorktrees, createWorktree, deleteWorktree } = useWorktrees(projectName!);
  const { discussions, loading: discussionsLoading, refresh: refreshDiscussions } = useDiscussions(projectName!);

  function updateProjectDetailSearch(nextState: Partial<typeof parsedSearchState>) {
    const mergedState = {
      ...parsedSearchState,
      ...nextState
    };
    const nextParams = new URLSearchParams();
    if (mergedState.projectView !== 'milestones') nextParams.set('view', mergedState.projectView);
    if (mergedState.selectedDiscussionId) nextParams.set('discussion', mergedState.selectedDiscussionId);
    if (mergedState.taskMilestoneFilter !== ALL_MILESTONES) nextParams.set('milestone', mergedState.taskMilestoneFilter);
    if (mergedState.taskStatusFilter !== ALL_STATUSES) nextParams.set('status', mergedState.taskStatusFilter);
    if (mergedState.taskLabelFilters.length > 0) nextParams.set('labels', mergedState.taskLabelFilters.join(','));
    if (mergedState.taskSortField !== 'priority') nextParams.set('sortField', mergedState.taskSortField);
    if (mergedState.taskSortDirection !== 'asc') nextParams.set('sortDir', mergedState.taskSortDirection);

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }

  const allLabels = useMemo(
    () => normalizeTaskLabels(tasks.flatMap((task) => task.labels)).sort((a, b) => a.localeCompare(b)),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    const next = tasks.filter((task) => {
      if (taskMilestoneFilter === NO_MILESTONE && task.milestone_id) return false;
      if (taskMilestoneFilter !== ALL_MILESTONES && taskMilestoneFilter !== NO_MILESTONE && task.milestone_id !== taskMilestoneFilter) return false;
      if (taskStatusFilter === COMPLETED_FILTER && !isTaskCompleted(task.status)) return false;
      if (taskStatusFilter !== ALL_STATUSES && taskStatusFilter !== COMPLETED_FILTER && task.status !== taskStatusFilter) return false;
      if (taskLabelFilters.length > 0 && !task.labels.some((label) => taskLabelFilters.includes(normalizeTaskLabel(label)))) return false;
      return true;
    });

    return [...next].sort((a, b) => compareTasks(a, b, taskSortField, taskSortDirection));
  }, [taskLabelFilters, taskMilestoneFilter, taskSortDirection, taskSortField, taskStatusFilter, tasks]);

  const overallSummary = useMemo(() => buildTaskSummary(tasks), [tasks]);
  const filteredSummary = useMemo(() => buildTaskSummary(filteredTasks), [filteredTasks]);

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

        const done = subtasks.filter((subtask) => isTaskCompleted(subtask.status)).length;
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

  const milestoneInsights = useMemo(() => {
    return milestones
      .map((milestone) => {
        const milestoneTasks = tasks.filter((task) => task.milestone_id === milestone.id);
        return {
          id: milestone.id,
          name: milestone.name,
          due_date: milestone.due_date,
          summary: buildTaskSummary(milestoneTasks)
        };
      })
      .sort((left, right) => right.summary.total - left.summary.total || left.name.localeCompare(right.name));
  }, [milestones, tasks]);

  const taskFilterSummary = useMemo(() => {
    const parts: string[] = [];

    if (taskMilestoneFilter === ALL_MILESTONES) {
      parts.push('全部里程碑');
    } else if (taskMilestoneFilter === NO_MILESTONE) {
      parts.push('无里程碑');
    } else {
      parts.push(milestones.find((milestone) => milestone.id === taskMilestoneFilter)?.name || '未知里程碑');
    }

    if (taskStatusFilter === ALL_STATUSES) {
      parts.push('全部状态');
    } else if (taskStatusFilter === COMPLETED_FILTER) {
      parts.push('已完成');
    } else {
      parts.push(formatTaskStatus(taskStatusFilter as Task['status']));
    }

    if (taskLabelFilters.length === 1) {
      parts.push(`标签 ${taskLabelFilters[0]}`);
    } else if (taskLabelFilters.length > 1) {
      parts.push(`标签 ${taskLabelFilters.join(' / ')}`);
    } else {
      parts.push('全部标签');
    }

    parts.push(`排序 ${taskSortField === 'priority' ? '优先级' : taskSortField === 'created_at' ? '时间' : '名称'}${taskSortDirection === 'asc' ? '正序' : '倒序'}`);

    return parts.join(' / ');
  }, [milestones, taskLabelFilters, taskMilestoneFilter, taskSortDirection, taskSortField, taskStatusFilter]);

  function handleProjectViewChange(view: ProjectView) {
    updateProjectDetailSearch({ projectView: view });
  }

  function handleToggleTaskLabelFilter(label: string) {
    const normalizedLabel = normalizeTaskLabel(label);
    updateProjectDetailSearch({
      taskLabelFilters: taskLabelFilters.includes(normalizedLabel)
        ? taskLabelFilters.filter((item) => item !== normalizedLabel)
        : [...taskLabelFilters, normalizedLabel]
    });
  }

  function handleClearTaskLabelFilters() {
    updateProjectDetailSearch({ taskLabelFilters: [] });
  }

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    await createTask(projectName!, {
      title: data.get('title'),
      description: data.get('description'),
      priority: data.get('priority'),
      milestone_id: data.get('milestone') || null,
      labels: normalizeTaskLabels((data.get('labels') as string)?.split(',') || [])
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
    refreshMilestones();
    refreshTasks();
  }

  function refreshAll() {
    refreshTasks();
    refreshMilestones();
    refreshWorktrees();
    refreshDiscussions();
  }

  function handleOpenDiscussion(id: string) {
    updateProjectDetailSearch({
      projectView: 'discussion',
      selectedDiscussionId: id
    });
  }

  function handleClearDiscussion() {
    updateProjectDetailSearch({
      selectedDiscussionId: ''
    });
  }

  if (projectView === 'discussion') {
    return (
      <>
        <TopBar
          title={projectName || 'Project'}
          backTo="/"
          backLabel="首页"
          searchPlaceholder="搜索 discussion"
          rightSlot={
            <div className="flex gap-2">
              <button
                onClick={() => handleProjectViewChange('milestones')}
                className={`rounded px-3 py-1 text-xs ${projectView === 'milestones' ? 'bg-primary text-white' : 'bg-gray-200 text-slate-700'}`}
              >
                里程碑
              </button>
              <button
                onClick={() => handleProjectViewChange('tasks')}
                className={`rounded px-3 py-1 text-xs ${projectView === 'tasks' ? 'bg-primary text-white' : 'bg-gray-200 text-slate-700'}`}
              >
                任务
              </button>
              <button
                onClick={() => handleProjectViewChange('worktrees')}
                className={`rounded px-3 py-1 text-xs ${projectView === 'worktrees' ? 'bg-primary text-white' : 'bg-gray-200 text-slate-700'}`}
              >
                Worktrees
              </button>
              <button
                onClick={() => handleProjectViewChange('discussion')}
                className={`rounded px-3 py-1 text-xs ${projectView === 'discussion' ? 'bg-primary text-white' : 'bg-gray-200 text-slate-700'}`}
              >
                Discussion
              </button>
              <button onClick={refreshAll} className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white hover:bg-primary-hover">
                刷新
              </button>
            </div>
          }
        />

        <ProjectDiscussionContent
          projectName={projectName!}
          discussions={discussions}
          loading={discussionsLoading}
          availableLabels={allLabels}
          selectedDiscussionId={selectedDiscussionId}
          onSelectDiscussion={handleOpenDiscussion}
          onClearDiscussion={handleClearDiscussion}
          onRefresh={refreshDiscussions}
        />
        {projectName && <TerminalOverviewFloating projectName={projectName} showConfig defaultExpanded />}
      </>
    );
  }

  const sidebar =
    projectView === 'tasks' ? (
      <aside className="space-y-3 rounded-lg border border-border bg-surface p-3">
        <section className="space-y-2 rounded-md border border-border bg-white p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">筛选条件</h2>
          <label className="block space-y-1 text-xs text-muted">
            <span>Milestone</span>
            <select
              value={taskMilestoneFilter}
              onChange={(event) => updateProjectDetailSearch({ taskMilestoneFilter: event.target.value })}
              className="w-full rounded border border-border bg-white p-2 text-xs text-text"
            >
              <option value={ALL_MILESTONES}>全部里程碑</option>
              <option value={NO_MILESTONE}>无里程碑</option>
              {milestones.map((milestone) => (
                <option key={milestone.id} value={milestone.id}>
                  {milestone.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-xs text-muted">
            <span>完成状态</span>
            <select
              value={taskStatusFilter}
              onChange={(event) => updateProjectDetailSearch({ taskStatusFilter: event.target.value })}
              className="w-full rounded border border-border bg-white p-2 text-xs text-text"
            >
              <option value={ALL_STATUSES}>全部状态</option>
              <option value="todo">待开始</option>
              <option value="in_progress">进行中</option>
              <option value={COMPLETED_FILTER}>已完成</option>
              <option value="blocked">阻塞</option>
            </select>
          </label>
          <div className="space-y-2 text-xs text-muted">
            <div className="flex items-center justify-between gap-2">
              <span>标签筛选</span>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-border bg-slate-50 px-2 py-0.5 text-[11px] text-muted">
                  {taskLabelFilters.length === 0 ? '全部' : `已选 ${taskLabelFilters.length}`}
                </span>
                <button
                  type="button"
                  onClick={handleClearTaskLabelFilters}
                  className="whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  重置
                </button>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-white p-3">
              {allLabels.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-slate-50 px-3 py-2 text-[11px] text-muted">当前项目暂无标签</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allLabels.map((label) => (
                    <LabelBadge
                      key={label}
                      label={label}
                      selected={taskLabelFilters.includes(label)}
                      onClick={() => handleToggleTaskLabelFilter(label)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-2 rounded-md border border-border bg-white p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">筛选结果</h3>
          <p className="text-xs text-muted">{taskFilterSummary}</p>
          <div className="mt-2 flex items-end justify-between rounded border border-border bg-slate-50 p-2">
            <p className="text-sm font-semibold text-text">
              {filteredSummary.done}/{filteredSummary.total}
            </p>
            <p className="text-xs font-medium text-primary">{filteredSummary.percent}%</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border border-border bg-slate-50 p-2">
              <p className="text-muted">待开始</p>
              <p className="font-semibold text-text">{filteredSummary.todo}</p>
            </div>
            <div className="rounded border border-border bg-slate-50 p-2">
              <p className="text-muted">进行中</p>
              <p className="font-semibold text-text">{filteredSummary.inProgress}</p>
            </div>
            <div className="rounded border border-border bg-slate-50 p-2">
              <p className="text-muted">已完成</p>
              <p className="font-semibold text-text">{filteredSummary.done}</p>
            </div>
            <div className="rounded border border-border bg-slate-50 p-2">
              <p className="text-muted">阻塞</p>
              <p className="font-semibold text-text">{filteredSummary.blocked}</p>
            </div>
          </div>
        </section>
      </aside>
    ) : projectView === 'milestones' ? (
      <aside className="space-y-3 rounded-lg border border-border bg-surface p-3">
        <section className="space-y-2 rounded-md border border-border bg-white p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">项目进度</h2>
          <div className="flex items-end justify-between rounded border border-border bg-slate-50 p-2">
            <p className="text-sm font-semibold text-text">
              {overallSummary.done}/{overallSummary.total}
            </p>
            <p className="text-xs font-medium text-primary">{overallSummary.percent}%</p>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-primary transition-all duration-200" style={{ width: `${overallSummary.percent}%` }} />
          </div>
        </section>

        <section className="space-y-2 rounded-md border border-border bg-white p-3 text-xs">
          <h3 className="font-semibold uppercase tracking-wide text-muted">里程碑概览</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-border bg-slate-50 p-2">
              <p className="text-muted">总数</p>
              <p className="font-semibold text-text">{milestones.length}</p>
            </div>
            <div className="rounded border border-border bg-slate-50 p-2">
              <p className="text-muted">无里程碑任务</p>
              <p className="font-semibold text-text">{tasks.filter((task) => !task.milestone_id).length}</p>
            </div>
          </div>
          <div className="rounded border border-dashed border-border p-2 text-muted">
            该页面展示目标清单、里程碑总体完成度，以及按优先级聚合后的任务进度。
          </div>
        </section>
      </aside>
    ) : (
      <aside className="space-y-3 rounded-lg border border-border bg-surface p-3">
        <section className="space-y-2 rounded-md border border-border bg-white p-3 text-xs">
          <h2 className="font-semibold uppercase tracking-wide text-muted">Worktree 概览</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-border bg-slate-50 p-2">
              <p className="text-muted">总数</p>
              <p className="font-semibold text-text">{worktrees.length}</p>
            </div>
            <div className="rounded border border-border bg-slate-50 p-2">
              <p className="text-muted">Active</p>
              <p className="font-semibold text-text">{worktrees.filter((item) => item.status === 'active').length}</p>
            </div>
          </div>
        </section>
      </aside>
    );

  const main =
    projectView === 'tasks' ? (
      <section className="space-y-3" data-testid="project-detail-tasks">
        <header className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-text">任务列表</h2>
              <p className="mt-1 text-xs text-muted">筛选保留在左侧，排序移动到页面上方，支持按优先级、时间、名称正序/倒序查看。</p>
            </div>
            <button
              onClick={() => setShowTaskForm((value) => !value)}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
            >
              {showTaskForm ? '关闭' : '新建任务'}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-xs">
            <span className="font-medium text-muted">排序方式</span>
            <div className="inline-flex flex-wrap gap-1 rounded-full bg-slate-50 p-1">
              {([
                ['priority', '优先级'],
                ['created_at', '时间'],
                ['title', '名称']
              ] as const).map(([field, label]) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => updateProjectDetailSearch({ taskSortField: field })}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                    taskSortField === field ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="inline-flex gap-1 rounded-full bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => updateProjectDetailSearch({ taskSortDirection: 'asc' })}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  taskSortDirection === 'asc' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:bg-white'
                }`}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => updateProjectDetailSearch({ taskSortDirection: 'desc' })}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  taskSortDirection === 'desc' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:bg-white'
                }`}
              >
                ↓
              </button>
            </div>
            <span className="rounded-full border border-border bg-slate-50 px-2 py-0.5 text-[11px] text-muted">
              {taskSortField === 'priority' ? '优先级' : taskSortField === 'created_at' ? '时间' : '名称'} · {taskSortDirection === 'asc' ? '正序' : '倒序'}
            </span>
          </div>
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
                <option value="">无里程碑</option>
                {milestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              name="labels"
              placeholder="labels，使用逗号分隔"
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

        {tasksLoading ? (
          <p className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">任务加载中...</p>
        ) : (
          <TaskList
            tasks={filteredTasks}
            projectName={projectName!}
            currentSearch={searchParams.toString() ? `?${searchParams.toString()}` : ''}
            emptyText="当前筛选下暂无任务"
          />
        )}
      </section>
    ) : projectView === 'milestones' ? (
      <section className="space-y-3" data-testid="project-detail-milestones">
        <section className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text">里程碑页</h2>
              <p className="mt-1 text-xs text-muted">第一页聚焦目标清单与里程碑完成进度，同时展示按优先级聚合后的任务完成度。</p>
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

          {milestonesLoading ? (
            <p className="rounded border border-dashed border-border p-6 text-center text-sm text-muted">里程碑加载中...</p>
          ) : milestones.length === 0 ? (
            <p className="rounded border border-dashed border-border p-6 text-center text-sm text-muted">暂无里程碑，先创建一个吧。</p>
          ) : (
            <MilestoneList milestones={milestones} tasks={tasks} onUpdate={handleUpdateMilestone} onDelete={handleDeleteMilestone} />
          )}
        </section>
      </section>
    ) : (
      <section className="space-y-3 rounded-lg border border-border bg-surface p-4">
        {worktreesLoading ? (
          <p className="rounded border border-dashed border-border p-6 text-center text-sm text-muted">Worktree 加载中...</p>
        ) : (
          <WorktreeList worktrees={worktrees} onDelete={deleteWorktree} onCreate={createWorktree} />
        )}
      </section>
    );

  const rail =
    projectView === 'tasks' ? (
      <aside className="space-y-3 rounded-lg border border-border bg-surface p-3">
        <section className="space-y-2 rounded-md border border-border bg-white p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">子任务进度</h3>
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
    ) : projectView === 'milestones' ? (
      <aside className="space-y-3 rounded-lg border border-border bg-surface p-3">
        <section className="space-y-2 rounded-md border border-border bg-white p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">里程碑任务进度</h3>
          {milestoneInsights.length === 0 ? (
            <p className="rounded border border-dashed border-border p-3 text-xs text-muted">暂无里程碑任务数据</p>
          ) : (
            <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              {milestoneInsights.map((item) => (
                <div key={item.id} className="rounded border border-border bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-2 text-xs">
                    <div>
                      <p className="font-medium text-text">{item.name}</p>
                      <p className="mt-1 text-muted">
                        {item.summary.done}/{item.summary.total} · {item.due_date || '未设置截止日期'}
                      </p>
                    </div>
                    <span className="text-primary">{item.summary.percent}%</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                    <div className="h-1.5 rounded-full bg-primary transition-all duration-200" style={{ width: `${item.summary.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </aside>
    ) : (
      <aside className="space-y-3 rounded-lg border border-border bg-surface p-3">
        <section className="space-y-2 rounded-md border border-border bg-white p-3 text-xs">
          <h3 className="font-semibold uppercase tracking-wide text-muted">分支列表</h3>
          {worktrees.length === 0 ? (
            <p className="text-muted">暂无 worktree</p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {worktrees.map((item) => (
                <div key={item.branch} className="rounded border border-border bg-slate-50 p-2">
                  <p className="font-medium text-text">{item.branch}</p>
                  <p className="mt-1 text-muted">{item.worktree_path}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </aside>
    );

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
              onClick={() => handleProjectViewChange('milestones')}
              className={`rounded px-3 py-1 text-xs ${projectView === 'milestones' ? 'bg-primary text-white' : 'bg-gray-200 text-slate-700'}`}
            >
              里程碑
            </button>
            <button
              onClick={() => handleProjectViewChange('tasks')}
              className={`rounded px-3 py-1 text-xs ${projectView === 'tasks' ? 'bg-primary text-white' : 'bg-gray-200 text-slate-700'}`}
            >
              任务
            </button>
            <button
              onClick={() => handleProjectViewChange('worktrees')}
              className={`rounded px-3 py-1 text-xs ${projectView === 'worktrees' ? 'bg-primary text-white' : 'bg-gray-200 text-slate-700'}`}
            >
              Worktrees
            </button>
            <button
              onClick={() => handleProjectViewChange('discussion')}
              className={`rounded px-3 py-1 text-xs ${projectView === 'discussion' ? 'bg-primary text-white' : 'bg-gray-200 text-slate-700'}`}
            >
              Discussion
            </button>
            <button onClick={refreshAll} className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white hover:bg-primary-hover">
              刷新
            </button>
          </div>
        }
      />

      <Shell sidebar={sidebar} main={main} rail={rail} />
      {projectName && <TerminalOverviewFloating projectName={projectName} showConfig defaultExpanded />}
    </>
  );
}
