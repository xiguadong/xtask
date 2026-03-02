import type { TaskPriority, TaskStatus } from './types';

export const TASK_STATUSES: TaskStatus[] = ['todo', 'doing', 'blocked', 'done'];
export const TASK_PRIORITIES: TaskPriority[] = ['critical', 'high', 'medium', 'low'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  doing: 'Doing',
  blocked: 'Blocked',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
