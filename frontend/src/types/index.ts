export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
  name: string;
  path: string;
  created_at: string;
  hidden: boolean;
  taskCount?: number;
  milestoneCount?: number;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  due_date: string | null;
  status: 'active' | 'completed' | 'archived';
  goals?: MilestoneGoal[];
}

export interface MilestoneGoal {
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  description_file: string | null;
  description_content?: string;
  summary_file: string | null;
  summary_content?: string;
  status: TaskStatus;
  priority: TaskPriority;
  milestone_id: string | null;
  parent_tasks: string[];
  labels: string[];
  created_at: string;
  updated_at: string;
  created_by: 'cli' | 'web';
  agent: {
    assigned: boolean;
    identity: string | null;
    assigned_at: string | null;
    session_id?: string | null;
    status: 'pending' | 'running' | 'completed' | 'failed' | null;
  };
  git: {
    branch: string | null;
    commits: string[];
    source_branch?: string | null;
  };
  terminal: TaskTerminal;
}

export interface TaskTerminal {
  enabled: boolean;
  mode: 'local' | 'ssh' | null;
  session_id: string | null;
  status: 'running' | 'working' | 'waiting' | 'stopped';
  host: string | null;
  port: number;
  username: string | null;
  timeout_days: number;
  auto_stop_on_task_done: boolean;
  started_at: string | null;
  last_active_at: string | null;
  stopped_at: string | null;
  stop_reason: string | null;
}

export interface TerminalSessionSummary {
  taskId: string;
  taskTitle: string;
  sessionId: string;
  mode: 'local' | 'ssh';
  runtimeStatus: 'working' | 'waiting';
  startedAt: string;
  lastActiveAt: string;
  timeoutDays: number;
  autoStopOnTaskDone: boolean;
  ssh: {
    host: string;
    port: number;
    username: string;
  } | null;
}

export interface TerminalOverview {
  config: TerminalConfig;
  counts: {
    total: number;
    working: number;
    waiting: number;
    max: number;
    available: number;
  };
  items: TerminalSessionSummary[];
}

export interface TerminalConfig {
  max_terminals: number;
}

export interface Worktree {
  branch: string;
  worktree_path: string;
  created_at: string;
  agent: {
    identity: string | null;
    model: string | null;
  };
  status: 'active' | 'merged' | 'deleted';
  tasks: string[];
  last_commit: string | null;
}
