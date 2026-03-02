import type { MilestoneWithProgress, Relation, Task, TaskStatus } from './types';

export interface PlanChildTask {
  task: Task;
  hiddenDescendants: number;
}

export interface PlanRootTask {
  task: Task;
  children: PlanChildTask[];
}

export interface PlanSection {
  id: string;
  title: string;
  dueDate: string;
  type: 'milestone' | 'backlog';
  total: number;
  done: number;
  percent: number;
  roots: PlanRootTask[];
}

const BACKLOG_SECTION_ID = 'backlog';

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

function buildChildrenMap(tasks: Task[], relations: Relation[]): Map<string, string[]> {
  const taskSet = new Set(tasks.map((task) => task.id));
  const map = new Map<string, string[]>();
  for (const rel of relations) {
    if (rel.type !== 'parent_child') {
      continue;
    }
    if (!taskSet.has(rel.source_id) || !taskSet.has(rel.target_id)) {
      continue;
    }
    const children = map.get(rel.source_id) || [];
    children.push(rel.target_id);
    map.set(rel.source_id, children);
  }
  return map;
}

function countByStatus(tasks: Task[], status: TaskStatus): number {
  return tasks.filter((task) => task.status === status).length;
}

function countDescendants(taskID: string, childrenMap: Map<string, string[]>, path: Set<string>): number {
  if (path.has(taskID)) {
    return 0;
  }
  path.add(taskID);
  const children = childrenMap.get(taskID) || [];
  let total = children.length;
  for (const childID of children) {
    total += countDescendants(childID, childrenMap, path);
  }
  path.delete(taskID);
  return total;
}

function buildRoots(sectionTasks: Task[], relations: Relation[]): PlanRootTask[] {
  const byID = new Map(sectionTasks.map((task) => [task.id, task]));
  const childrenMap = buildChildrenMap(sectionTasks, relations);
  const hasParent = new Set<string>();

  for (const rel of relations) {
    if (rel.type !== 'parent_child') {
      continue;
    }
    if (byID.has(rel.source_id) && byID.has(rel.target_id)) {
      hasParent.add(rel.target_id);
    }
  }

  const roots = sortTasks(sectionTasks.filter((task) => !hasParent.has(task.id)));
  return roots.map((root) => {
    const childIDs = childrenMap.get(root.id) || [];
    const children = sortTasks(childIDs.map((id) => byID.get(id)).filter((task): task is Task => Boolean(task))).map((child) => ({
      task: child,
      hiddenDescendants: countDescendants(child.id, childrenMap, new Set()),
    }));
    return { task: root, children };
  });
}

export function buildPlanSections(tasks: Task[], milestones: MilestoneWithProgress[], relations: Relation[]): PlanSection[] {
  if (tasks.length === 0) {
    return [];
  }

  const sectionByMilestone = new Map<string, Task[]>();
  const milestoneIDs = new Set(milestones.map((m) => m.id));
  const backlog: Task[] = [];

  for (const task of tasks) {
    if (!task.milestone_id || !milestoneIDs.has(task.milestone_id)) {
      backlog.push(task);
      continue;
    }
    const group = sectionByMilestone.get(task.milestone_id) || [];
    group.push(task);
    sectionByMilestone.set(task.milestone_id, group);
  }

  const sections: PlanSection[] = [];

  if (backlog.length > 0) {
    const done = countByStatus(backlog, 'done');
    const total = backlog.length;
    sections.push({
      id: BACKLOG_SECTION_ID,
      title: 'Backlog / Unplanned',
      dueDate: '',
      type: 'backlog',
      total,
      done,
      percent: total > 0 ? Math.floor((done / total) * 100) : 0,
      roots: buildRoots(backlog, relations),
    });
  }

  const milestoneSections: PlanSection[] = [];
  for (const milestone of milestones) {
    const sectionTasks = sectionByMilestone.get(milestone.id) || [];
    if (sectionTasks.length === 0) {
      continue;
    }
    const done = countByStatus(sectionTasks, 'done');
    const total = sectionTasks.length;
    milestoneSections.push({
      id: milestone.id,
      title: milestone.title,
      dueDate: milestone.due_date,
      type: 'milestone',
      total,
      done,
      percent: total > 0 ? Math.floor((done / total) * 100) : 0,
      roots: buildRoots(sectionTasks, relations),
    });
  }

  milestoneSections.sort((a, b) => {
    const dueDiff = toTimestamp(a.dueDate) - toTimestamp(b.dueDate);
    if (dueDiff !== 0) {
      return dueDiff;
    }
    return a.title.localeCompare(b.title);
  });

  return sections.concat(milestoneSections);
}
