import type { Label, Task, TaskStatus } from './types';

export interface FeatureGroup {
  id: string;
  title: string;
  tasks: Task[];
  counts: Record<TaskStatus, number>;
}

const FEATURE_PREFIX = 'feature:';
const UNASSIGNED_GROUP: FeatureGroup = {
  id: 'feature:unassigned',
  title: 'Unassigned',
  tasks: [],
  counts: { todo: 0, doing: 0, blocked: 0, done: 0 },
};

function toTimestamp(value: string): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? Number.POSITIVE_INFINITY : ts;
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const dueDiff = toTimestamp(a.due_date) - toTimestamp(b.due_date);
    if (dueDiff !== 0) {
      return dueDiff;
    }
    return a.title.localeCompare(b.title);
  });
}

function emptyCounts(): Record<TaskStatus, number> {
  return { todo: 0, doing: 0, blocked: 0, done: 0 };
}

function extractFeatureKeys(task: Task, nameByID: Map<string, string>): string[] {
  const keys = new Set<string>();
  for (const rawLabel of task.labels) {
    const candidates = [rawLabel, nameByID.get(rawLabel) || ''];
    for (const candidate of candidates) {
      const normalized = candidate.trim().toLowerCase();
      if (!normalized.startsWith(FEATURE_PREFIX)) {
        continue;
      }
      const featureName = candidate.slice(FEATURE_PREFIX.length).trim();
      if (featureName) {
        keys.add(featureName);
      }
    }
  }
  return [...keys];
}

export function buildFeatureGroups(tasks: Task[], labels: Label[]): FeatureGroup[] {
  if (tasks.length === 0) {
    return [];
  }

  const nameByID = new Map(labels.map((label) => [label.id, label.name]));
  const groups = new Map<string, FeatureGroup>();
  const unassigned: FeatureGroup = { ...UNASSIGNED_GROUP, tasks: [], counts: emptyCounts() };

  for (const task of tasks) {
    const keys = extractFeatureKeys(task, nameByID);
    if (keys.length === 0) {
      unassigned.tasks.push(task);
      unassigned.counts[task.status] += 1;
      continue;
    }

    for (const key of keys) {
      const groupID = `${FEATURE_PREFIX}${key.toLowerCase()}`;
      const group = groups.get(groupID) || { id: groupID, title: key, tasks: [], counts: emptyCounts() };
      group.tasks.push(task);
      group.counts[task.status] += 1;
      groups.set(groupID, group);
    }
  }

  const sorted = [...groups.values()]
    .map((group) => ({ ...group, tasks: sortTasks(group.tasks) }))
    .sort((a, b) => {
      if (b.tasks.length !== a.tasks.length) {
        return b.tasks.length - a.tasks.length;
      }
      return a.title.localeCompare(b.title);
    });

  if (unassigned.tasks.length > 0) {
    sorted.push({ ...unassigned, tasks: sortTasks(unassigned.tasks) });
  }

  return sorted;
}
