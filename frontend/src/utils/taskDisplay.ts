import { Task, TaskPriority, TaskStatus } from '../types';

export type TaskSortField = 'priority' | 'created_at' | 'title';
export type TaskSortDirection = 'asc' | 'desc';

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
  done: 3
};

function parseTaskIdTime(id: string) {
  const msMatch = id.match(/^(\d{13})/);
  if (msMatch) {
    const date = new Date(Number(msMatch[1]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const humanMatch = id.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})-(\d{1,2})-(\d{1,2})-(\d{1,2})(?:-(\d{1,3}))?/
  );
  if (!humanMatch) return null;

  const [, year, month, day, hour, minute, second, millisecond] = humanMatch;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    millisecond ? Number(millisecond) : 0
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeTaskStatus(status: TaskStatus | string): TaskStatus {
  if (status === 'completed') return 'done';
  if (status === 'in_progress' || status === 'blocked' || status === 'done') return status;
  return 'todo';
}

export const completedTaskStatuses = new Set<TaskStatus>(['done']);

export function isTaskCompleted(status: TaskStatus | string) {
  return completedTaskStatuses.has(normalizeTaskStatus(status));
}

export function formatTaskStatus(status: TaskStatus | string) {
  switch (normalizeTaskStatus(status)) {
    case 'todo':
      return '待开始';
    case 'in_progress':
      return '进行中';
    case 'done':
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
  const idTime = parseTaskIdTime(task.id);
  if (idTime) return idTime;
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

  const fromId = slugify(
    task.id
      .replace(/^\d{13}-?/, '')
      .replace(/^\d{4}-\d{1,2}-\d{1,2}-\d{1,2}-\d{1,2}-\d{1,2}(?:-\d{1,3})?-?/, '')
  );
  if (fromId) return fromId;

  return 'task';
}

function formatTimestampForId(date: Date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
    String(date.getMilliseconds()).padStart(3, '0')
  ].join('-');
}

export function formatTaskWorktreeBranchName(task: Task) {
  const rawId = String(task.id || '').trim();
  if (!rawId) return 'task';

  if (/^\d{4}-\d{1,2}-\d{1,2}-\d{1,2}-\d{1,2}-\d{1,2}(?:-\d{1,3})?/.test(rawId)) {
    return rawId;
  }

  const msMatch = rawId.match(/^(\d{13})(?:-(.*))?$/);
  if (msMatch) {
    const date = new Date(Number(msMatch[1]));
    if (!Number.isNaN(date.getTime())) {
      const suffixFromId = String(msMatch[2] || '').trim().replace(/^-+|-+$/g, '');
      const suffix = suffixFromId || getTaskNamePart(task) || 'task';
      return `${formatTimestampForId(date)}-${suffix}`;
    }
  }

  return rawId;
}

export function formatTaskDisplayId(task: Task) {
  const date = getTaskTime(task);
  const timestamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('-');

  return `${getTaskNamePart(task)}-${timestamp}`;
}

export function formatTaskDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function compareTasks(a: Task, b: Task, field: TaskSortField, direction: TaskSortDirection) {
  const createdDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  const directionFactor = direction === 'asc' ? 1 : -1;

  switch (field) {
    case 'title': {
      const byTitle = a.title.localeCompare(b.title, 'zh-Hans-CN');
      if (byTitle !== 0) return byTitle * directionFactor;
      return createdDiff * directionFactor;
    }
    case 'created_at':
      return -createdDiff * directionFactor;
    case 'priority':
    default: {
      const byPriority = priorityRank[a.priority] - priorityRank[b.priority];
      if (byPriority !== 0) return byPriority * directionFactor;
      const byStatus = statusRank[normalizeTaskStatus(a.status)] - statusRank[normalizeTaskStatus(b.status)];
      if (byStatus !== 0) return byStatus;
      return -createdDiff;
    }
  }
}
