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
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
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
