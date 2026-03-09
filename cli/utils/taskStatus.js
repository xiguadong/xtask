const TASK_STATUSES = ['todo', 'in_progress', 'done', 'blocked'];

export function normalizeTaskStatus(status, fallback = 'todo') {
  if (!status) return fallback;
  const value = String(status).trim();
  if (value === 'completed') return 'done';
  if (value === 'pending') return 'todo';
  return TASK_STATUSES.includes(value) ? value : fallback;
}

export function getTaskStatuses() {
  return [...TASK_STATUSES];
}
