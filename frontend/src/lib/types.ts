export type ProjectHealth = 'healthy' | 'at_risk' | 'blocked';
export type MilestoneStatus = 'open' | 'closed';
export type TaskStatus = 'todo' | 'doing' | 'blocked' | 'done';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type RelationType = 'parent_child' | 'blocks' | 'related_strong' | 'related_weak';
export type ProjectViewMode = 'board' | 'list' | 'plan' | 'feature';

export interface ProjectSummary {
  id: string;
  name: string;
  status: ProjectHealth;
  active_milestone: string;
  progress: number;
  blocked_count: number;
  due_soon: boolean;
}

export interface SummaryStats {
  total: number;
  due_this_week: number;
  blocked_total: number;
}

export interface ProjectListResponse {
  projects: ProjectSummary[];
  summary: SummaryStats;
}

export interface ProjectMeta {
  id: string;
  name: string;
  description: string;
  status: ProjectHealth;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: MilestoneStatus;
  created_at: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  milestone_id: string;
  labels: string[];
  created_at: string;
  updated_at: string;
  updated_by: string;
  notes: string;
}

export interface Relation {
  id: string;
  type: RelationType;
  source_id: string;
  target_id: string;
}

export interface HistoryEntry {
  timestamp: string;
  task_id: string;
  field: string;
  old_value: string;
  new_value: string;
  actor: string;
}

export interface TaskGraph {
  version: number;
  project: ProjectMeta;
  milestones: Milestone[];
  labels: Label[];
  tasks: Task[];
  relations: Relation[];
  history: HistoryEntry[];
}

export interface MilestoneProgress {
  total: number;
  done: number;
  doing: number;
  blocked: number;
  todo: number;
  percent: number;
}

export interface MilestoneWithProgress extends Milestone {
  progress: MilestoneProgress;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
