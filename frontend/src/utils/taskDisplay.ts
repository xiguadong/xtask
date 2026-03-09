import { Task, TaskPriority, TaskStatus } from '../types';

export type TaskSortOption = 'created_desc' | 'created_asc' | 'priority_status' | 'status_priority';

const priorityRank: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

const statusRank: Record<TaskStatus, number> = {
  in_progress: 0,
  blocked: 1,
  todo: 2,
  done: 3,
  completed: 3
};

export const completedTaskStatuses = new Set<TaskStatus>(['done', 'completed']);

export function isTaskCompleted(status: TaskStatus) {
  return completedTaskStatuses.has(status);
}

export function formatTaskStatus(status: TaskStatus) {
  switch (status) {
    case 'todo':
      return '待开始';
    case 'in_progress':
      return '进行中';
    case 'done':
    case 'completed':
      return '已完成';
    case 'blocked':
      return '阻塞';
    default:
      return status;
  }
}

export function formatTaskPriority(priority: TaskPriority) {
  switch (priority) {
    case 'critical':
      return 'P0 / 紧急';
    case 'high':
      return 'P1 / 高';
    case 'medium':
      return 'P2 / 中';
    case 'low':
      return 'P3 / 低';
    default:
      return priority;
  }
}

function getTaskTime(task: Task) {
  const idTimestamp = task.id.match(/^(\d{13})/)?.[1];
  if (idTimestamp) {
    return new Date(Number(idTimestamp));
  }
  return new Date(task.created_at);
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function getTaskNamePart(task: Task) {
  const fromTitle = slugify(task.title || '');
  if (fromTitle) return fromTitle;

  const fromId = slugify(task.id.replace(/^\d+-?/, ''));
  if (fromId) return fromId;

  return 'task';
}

export function formatTaskDisplayId(task: Task) {
  const date = getTaskTime(task);
  const timestamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes())
  ].join('-');

  return `${getTaskNamePart(task)}-${timestamp}`;
}

export function formatTaskDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function compareTasks(a: Task, b: Task, sort: TaskSortOption) {
  const createdDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

  switch (sort) {
    case 'created_asc':
      return createdDiff;
    case 'created_desc':
      return -createdDiff;
    case 'status_priority': {
      const byStatus = statusRank[a.status] - statusRank[b.status];
      if (byStatus !== 0) return byStatus;
      const byPriority = priorityRank[a.priority] - priorityRank[b.priority];
      if (byPriority !== 0) return byPriority;
      return -createdDiff;
    }
    case 'priority_status':
    default: {
      const byPriority = priorityRank[a.priority] - priorityRank[b.priority];
      if (byPriority !== 0) return byPriority;
      const byStatus = statusRank[a.status] - statusRank[b.status];
      if (byStatus !== 0) return byStatus;
      return -createdDiff;
    }
  }
}
