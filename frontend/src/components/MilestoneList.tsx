import { useState } from 'react';
import { Milestone, MilestoneGoal, Task, TaskPriority } from '../types';
import { formatTaskPriority, isTaskCompleted } from '../utils/taskDisplay';

interface MilestoneListProps {
  milestones: Milestone[];
  tasks: Task[];
  onUpdate: (id: string, updates: Partial<Milestone>) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

const priorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
const visibleGoalRows = 5;
const goalViewportHeightClass = 'h-[11rem]';
const milestoneCardHeightClass = 'h-[31rem]';

function normalizeGoals(goals: unknown): MilestoneGoal[] {
  if (!Array.isArray(goals)) return [];

  return goals
    .map((goal) => {
      if (typeof goal === 'string') {
        const title = goal.trim();
        return title ? { title, done: false } : null;
      }

      if (!goal || typeof goal !== 'object') return null;

      const maybeGoal = goal as Partial<MilestoneGoal>;
      const title = String(maybeGoal.title || '').trim();
      if (!title) return null;

      return {
        title,
        done: Boolean(maybeGoal.done)
      };
    })
    .filter((goal): goal is MilestoneGoal => Boolean(goal));
}

export default function MilestoneList({
  milestones,
  tasks,
  onUpdate,
  onDelete
}: MilestoneListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftDueDate, setDraftDueDate] = useState('');
  const [draftGoals, setDraftGoals] = useState<MilestoneGoal[]>([]);

  function startEdit(milestone: Milestone) {
    setEditingId(milestone.id);
    setDraftName(milestone.name);
    setDraftDueDate(milestone.due_date || '');
    setDraftGoals(normalizeGoals((milestone as Milestone & { goals?: unknown }).goals));
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftGoals([]);
  }

  function addGoal() {
    setDraftGoals((prev) => [...prev, { title: '', done: false }]);
  }

  function updateDraftGoal(index: number, patch: Partial<MilestoneGoal>) {
    setDraftGoals((prev) => prev.map((goal, i) => (i === index ? { ...goal, ...patch } : goal)));
  }

  function removeDraftGoal(index: number) {
    setDraftGoals((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveEdit(id: string) {
    const goals = draftGoals
      .map((goal) => ({ title: goal.title.trim(), done: goal.done }))
      .filter((goal) => goal.title);

    await onUpdate(id, {
      name: draftName.trim() || '未命名里程碑',
      due_date: draftDueDate || null,
      goals
    });

    setEditingId(null);
  }

  async function toggleGoalDone(milestone: Milestone, index: number) {
    const goals = normalizeGoals((milestone as Milestone & { goals?: unknown }).goals);
    goals[index] = { ...goals[index], done: !goals[index].done };
    await onUpdate(milestone.id, { goals });
  }

  return (
    <div className="h-[560px] overflow-scroll rounded-md border border-border bg-white p-2" role="list" aria-label="里程碑列表">
      <div className="flex min-h-full min-w-max gap-3 pb-2 pr-2">
        {milestones.map((milestone) => {
          const goals = normalizeGoals((milestone as Milestone & { goals?: unknown }).goals);
          const completed = goals.filter((goal) => goal.done).length;
          const total = goals.length;
          const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
          const milestoneTasks = tasks.filter((task) => task.milestone_id === milestone.id);
          const completedTasks = milestoneTasks.filter((task) => isTaskCompleted(task.status)).length;
          const totalTasks = milestoneTasks.length;
          const taskProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
          const taskProgressByPriority = priorities
            .map((priority) => {
              const priorityTasks = milestoneTasks.filter((task) => task.priority === priority);
              if (priorityTasks.length === 0) return null;

              const priorityDone = priorityTasks.filter((task) => isTaskCompleted(task.status)).length;
              return {
                priority,
                done: priorityDone,
                total: priorityTasks.length,
                percent: Math.round((priorityDone / priorityTasks.length) * 100)
              };
            })
            .filter(
              (
                item
              ): item is {
                priority: TaskPriority;
                done: number;
                total: number;
                percent: number;
              } => Boolean(item)
            );
          const isEditing = editingId === milestone.id;

          return (
            <article
              key={milestone.id}
              className={`${milestoneCardHeightClass} w-[22rem] shrink-0 rounded-lg border border-border bg-white p-3 transition-colors duration-200`}
            >
              {!isEditing ? (
                <div className="flex h-full flex-col">
                  <div className="w-full text-left">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-text">{milestone.name}</h3>
                        <p className="mt-1 text-xs text-muted">
                          状态 {completed}/{total}
                        </p>
                      </div>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-muted">{progress}%</span>
                    </div>

                    <div className="mt-2 h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-primary transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-3 rounded-lg border border-border bg-slate-50 p-3">
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>关联任务进度</span>
                        <span>
                          {completedTasks}/{totalTasks}
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-200">
                        <div className="h-2 rounded-full bg-success transition-all duration-200" style={{ width: `${taskProgress}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className={`mt-4 ${goalViewportHeightClass} overflow-y-auto overflow-x-hidden rounded border border-border bg-slate-50 p-1`}>
                    {goals.length === 0 ? (
                      <p className="rounded border border-dashed border-border px-2 py-2 text-xs text-muted">暂无目标，点击编辑添加</p>
                    ) : (
                      goals.map((goal, index) => (
                        <label
                          key={`${milestone.id}-${goal.title}-${index}`}
                          className="flex min-h-8 cursor-pointer items-start gap-2 rounded px-1 py-1 text-xs hover:bg-slate-100"
                        >
                          <input
                            type="checkbox"
                            checked={goal.done}
                            onChange={async (event) => {
                              event.stopPropagation();
                              await toggleGoalDone(milestone, index);
                            }}
                            className="mt-0.5 h-3.5 w-3.5"
                          />
                          <span
                            title={goal.title}
                            className={`block flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${goal.done ? 'text-muted line-through' : 'text-text'}`}
                          >
                            {goal.title}
                          </span>
                        </label>
                      ))
                    )}
                  </div>

                  <p className="mt-2 text-[11px] text-muted">目标区固定展示 {visibleGoalRows} 条，超出后可上下滚动</p>

                  <div className="mt-4 rounded-lg border border-border bg-white p-3">
                    <div className="flex items-center justify-between text-xs">
                      <h4 className="font-semibold text-text">任务状态</h4>
                      <span className="text-muted">按优先级</span>
                    </div>

                    {taskProgressByPriority.length === 0 ? (
                      <p className="mt-2 text-xs text-muted">暂无关联任务</p>
                    ) : (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {taskProgressByPriority.map((item) => (
                          <div key={`${milestone.id}-${item.priority}`} className="rounded border border-border bg-slate-50 p-2">
                            <div className="flex items-center justify-between text-[11px] text-muted">
                              <span>{formatTaskPriority(item.priority)}</span>
                              <span>{item.percent}%</span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-slate-200">
                              <div className="h-1.5 rounded-full bg-primary transition-all duration-200" style={{ width: `${item.percent}%` }} />
                            </div>
                            <p className="mt-1 text-[11px] text-muted">
                              {item.done}/{item.total}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-3">
                      <button
                        onClick={() => startEdit(milestone)}
                        className="cursor-pointer text-xs font-medium text-primary hover:underline"
                      >
                        编辑
                      </button>
                      <button
                        onClick={async () => onDelete(milestone.id)}
                        className="cursor-pointer text-xs font-medium text-danger hover:underline"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <input
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    className="w-full rounded border border-border p-2 text-xs"
                    placeholder="里程碑名称"
                  />

                  <input
                    value={draftDueDate}
                    onChange={(event) => setDraftDueDate(event.target.value)}
                    type="date"
                    className="w-full rounded border border-border p-2 text-xs"
                  />

                  <div className={`mt-2 ${goalViewportHeightClass} overflow-y-auto overflow-x-hidden rounded border border-border bg-slate-50 p-1`}>
                    {draftGoals.map((goal, index) => (
                      <div key={`draft-${index}`} className="flex items-center gap-2 py-0.5">
                        <input
                          type="checkbox"
                          checked={goal.done}
                          onChange={(event) => updateDraftGoal(index, { done: event.target.checked })}
                          className="h-3.5 w-3.5"
                        />
                        <input
                          value={goal.title}
                          onChange={(event) => updateDraftGoal(index, { title: event.target.value })}
                          className="min-w-0 flex-1 rounded border border-border p-1.5 text-xs"
                          placeholder={`目标 ${index + 1}`}
                        />
                        <button
                          onClick={() => removeDraftGoal(index)}
                          className="cursor-pointer text-xs text-danger hover:underline"
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addGoal}
                    className="mt-2 cursor-pointer rounded border border-border px-2 py-1 text-xs hover:bg-slate-100"
                  >
                    + 新增目标
                  </button>

                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      className="cursor-pointer rounded border border-border px-2 py-1 text-xs hover:bg-slate-100"
                    >
                      取消
                    </button>
                    <button
                      onClick={async () => saveEdit(milestone.id)}
                      className="cursor-pointer rounded bg-primary px-2 py-1 text-xs font-semibold text-white hover:bg-primary-hover"
                    >
                      保存
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
