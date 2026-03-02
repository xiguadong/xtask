import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { ActivityLog } from './ActivityLog';
import { RelationList } from './RelationList';
import type { RelationType } from '../../lib/types';

export function TaskDrawer() {
  const tasks = useTaskStore((state) => state.tasks);
  const relations = useTaskStore((state) => state.relations);
  const selectedTaskId = useTaskStore((state) => state.selectedTaskId);
  const setSelectedTaskId = useTaskStore((state) => state.setSelectedTaskId);
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const createRelation = useTaskStore((state) => state.createRelation);
  const deleteRelation = useTaskStore((state) => state.deleteRelation);
  const history = useTaskStore((state) => state.history);
  const filters = useTaskStore((state) => state.filters);
  const clearFilters = useTaskStore((state) => state.clearFilters);
  const error = useTaskStore((state) => state.error);

  const task = useMemo(() => tasks.find((item) => item.id === selectedTaskId), [selectedTaskId, tasks]);
  const [relationSource, setRelationSource] = useState('');
  const [relationTarget, setRelationTarget] = useState('');
  const [relationType, setRelationType] = useState<RelationType>('related_weak');

  useEffect(() => {
    if (!task) {
      return;
    }
    setRelationSource(task.id);
    setRelationTarget('');
    setRelationType('related_weak');
  }, [task]);

  if (!selectedTaskId) return null;

  if (!task) {
    const hasFilters = Object.values(filters).some(Boolean);
    return (
      <aside
        className="fixed inset-x-0 bottom-0 z-30 rounded-t-xl border border-border bg-white p-4 shadow-lg animate-slide-in-up md:inset-y-0 md:right-0 md:left-auto md:w-[420px] md:rounded-none md:border-l md:border-t-0 md:animate-slide-in-right"
        data-testid="task-detail-drawer"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text">Task hidden by filters</h3>
          <button type="button" onClick={() => setSelectedTaskId('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {hasFilters && (
          <div className="mt-3 rounded border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
            <div className="inline-flex items-center gap-1" data-testid="blocked-rule-alert">
              <AlertTriangle className="h-3.5 w-3.5" />
              Current filter hides the selected task.
            </div>
            <button className="ml-2 underline" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}
      </aside>
    );
  }

  const taskHistory = history.filter((entry) => entry.task_id === task.id);

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-30 max-h-[90vh] overflow-auto rounded-t-xl border border-border bg-white p-4 shadow-lg animate-slide-in-up md:inset-y-0 md:right-0 md:left-auto md:w-[420px] md:max-h-none md:rounded-none md:border-l md:border-t-0 md:animate-slide-in-right"
      data-testid="project-task-drawer"
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[11px] text-muted">{task.id}</p>
          <h3 className="text-sm font-semibold text-text">{task.title}</h3>
        </div>
        <button type="button" className="rounded p-1 hover:bg-slate-100" onClick={() => setSelectedTaskId('')}>
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="space-y-3">
        <label className="block text-xs font-medium text-muted">
          Title
          <input
            className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
            defaultValue={task.title}
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (value && value !== task.title) {
                void updateTask(task.id, { title: value });
              }
            }}
          />
        </label>

        <label className="block text-xs font-medium text-muted">
          Description
          <textarea
            className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
            rows={3}
            defaultValue={task.description}
            onBlur={(event) => {
              if (event.target.value !== task.description) {
                void updateTask(task.id, { description: event.target.value });
              }
            }}
          />
        </label>

        <div className="grid gap-2 grid-cols-2">
          <label className="text-xs font-medium text-muted">
            Status
            <select
              value={task.status}
              onChange={(event) => void updateTask(task.id, { status: event.target.value as typeof task.status })}
              className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
            >
              <option value="todo">todo</option>
              <option value="doing">doing</option>
              <option value="blocked">blocked</option>
              <option value="done">done</option>
            </select>
          </label>

          <label className="text-xs font-medium text-muted">
            Priority
            <select
              value={task.priority}
              onChange={(event) => void updateTask(task.id, { priority: event.target.value as typeof task.priority })}
              className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
            >
              <option value="critical">critical</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
          </label>
        </div>

        <div className="grid gap-2 grid-cols-2">
          <label className="text-xs font-medium text-muted">
            Relation source
            <input
              value={relationSource}
              onChange={(event) => setRelationSource(event.target.value)}
              placeholder="task-id"
              className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-muted">
            Relation target
            <input
              value={relationTarget}
              onChange={(event) => setRelationTarget(event.target.value)}
              placeholder="task-id"
              className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
            />
          </label>
        </div>
        <div className="grid gap-2 grid-cols-[1fr_auto]">
          <label className="text-xs font-medium text-muted">
            Relation type
            <select
              value={relationType}
              onChange={(event) => setRelationType(event.target.value as RelationType)}
              className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
            >
              <option value="related_weak">related_weak</option>
              <option value="related_strong">related_strong</option>
              <option value="blocks">blocks</option>
              <option value="parent_child">parent_child</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              if (!relationSource || !relationTarget) {
                return;
              }
              void createRelation({
                type: relationType,
                source_id: relationSource,
                target_id: relationTarget,
              }).then(() => setRelationTarget(''));
            }}
            className="self-end rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
          >
            Add relation
          </button>
        </div>
        {error ? <p className="rounded border border-danger/30 bg-danger/10 p-2 text-xs text-danger">{error}</p> : null}

        <RelationList
          relations={relations}
          taskId={task.id}
          onDelete={(relId) => void deleteRelation(relId)}
          onFocusTask={(taskId) => setSelectedTaskId(taskId)}
        />

        <ActivityLog entries={taskHistory} />

        <button
          type="button"
          className="w-full rounded-md border border-danger/40 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10"
          onClick={() => void deleteTask(task.id)}
        >
          Delete Task
        </button>
      </div>
    </aside>
  );
}
