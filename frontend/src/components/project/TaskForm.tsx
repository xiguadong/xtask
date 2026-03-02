import { useState } from 'react';
import type { RelationType, TaskPriority } from '../../lib/types';
import { TASK_PRIORITIES } from '../../lib/constants';
import { useTaskStore } from '../../stores/taskStore';

interface TaskFormProps {
  onClose: () => void;
}

export function TaskForm({ onClose }: TaskFormProps) {
  const createTask = useTaskStore((state) => state.createTask);
  const createRelation = useTaskStore((state) => state.createRelation);
  const tasks = useTaskStore((state) => state.tasks);

  const [advanced, setAdvanced] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [relationType, setRelationType] = useState<RelationType>('related_weak');
  const [targetTaskId, setTargetTaskId] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;

    const created = await createTask({
      title,
      description,
      priority,
      due_date: dueDate || undefined,
    });

    if (created && advanced && targetTaskId && relationType) {
      await createRelation({ type: relationType, source_id: created.id, target_id: targetTaskId });
    }
    onClose();
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">New Task</h3>
        <button type="button" className="text-xs text-primary hover:underline" onClick={() => setAdvanced((prev) => !prev)}>
          {advanced ? 'Quick mode' : 'Advanced mode'}
        </button>
      </div>

      <label className="block text-xs font-medium text-muted">
        Title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
        />
      </label>

      <label className="block text-xs font-medium text-muted">
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
          rows={3}
        />
      </label>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-xs font-medium text-muted">
          Priority
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
          >
            {TASK_PRIORITIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-muted">
          Due date
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
          />
        </label>
      </div>

      {advanced && (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-xs font-medium text-muted">
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

          <label className="block text-xs font-medium text-muted">
            Target task
            <select
              value={targetTaskId}
              onChange={(event) => setTargetTaskId(event.target.value)}
              className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
            >
              <option value="">No relation</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-xs font-semibold">
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Create Task
        </button>
      </div>
    </form>
  );
}
