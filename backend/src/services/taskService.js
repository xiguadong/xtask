import path from 'path';
import fs from 'fs';
import { readYaml, writeYaml } from '../utils/yamlHelper.js';
import { fileExists, readDir, ensureDir } from '../utils/fileSystem.js';

function getDefaultTerminal() {
  return {
    enabled: false,
    mode: null,
    session_id: null,
    status: 'stopped',
    host: null,
    port: 22,
    username: null,
    timeout_days: 3,
    auto_stop_on_task_done: true,
    started_at: null,
    last_active_at: null,
    stopped_at: null,
    stop_reason: null
  };
}

function normalizeTask(task) {
  if (!task.agent) {
    task.agent = {};
  }
  task.agent = {
    assigned: false,
    identity: null,
    assigned_at: null,
    session_id: null,
    status: null,
    ...task.agent
  };

  if (!task.git) {
    task.git = {};
  }
  task.git = {
    branch: null,
    commits: [],
    source_branch: null,
    ...task.git
  };

  task.terminal = {
    ...getDefaultTerminal(),
    ...(task.terminal || {})
  };
  task.terminal.timeout_days = Math.max(1, Math.min(30, Number(task.terminal.timeout_days) || 3));
  task.terminal.auto_stop_on_task_done = task.terminal.auto_stop_on_task_done !== false;

  return task;
}

export function getTasks(projectPath, filters = {}) {
  const tasksDir = path.join(projectPath, '.xtask', 'tasks');
  if (!fileExists(tasksDir)) return [];

  const taskDirs = readDir(tasksDir);
  let tasks = taskDirs.map(dir => {
    const taskFile = path.join(tasksDir, dir, 'task.yaml');
    return fileExists(taskFile) ? normalizeTask(readYaml(taskFile)) : null;
  }).filter(Boolean);

  if (filters.milestone) {
    tasks = tasks.filter(t => t.milestone_id === filters.milestone);
  }
  if (filters.status) {
    tasks = tasks.filter(t => t.status === filters.status);
  }
  if (filters.label) {
    tasks = tasks.filter(t => t.labels.includes(filters.label));
  }
  if (filters.branch) {
    tasks = tasks.filter(t => t.git?.branch === filters.branch);
  }

  return tasks;
}

export function getTaskById(projectPath, id) {
  const taskFile = path.join(projectPath, '.xtask', 'tasks', id, 'task.yaml');
  if (!fileExists(taskFile)) return null;
  return normalizeTask(readYaml(taskFile));
}

export function createTask(projectPath, task) {
  const timestamp = Date.now();
  const slug = task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const id = `${timestamp}-${slug}`;

  const taskDir = path.join(projectPath, '.xtask', 'tasks', id);
  ensureDir(taskDir);

  const newTask = {
    id,
    title: task.title,
    description: task.description || '',
    description_file: task.description_file || null,
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    milestone_id: task.milestone_id || null,
    parent_tasks: task.parent_tasks || [],
    labels: task.labels || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: task.created_by || 'web',
    agent: {
      assigned: false,
      identity: null,
      assigned_at: null,
      session_id: null,
      status: null
    },
    terminal: getDefaultTerminal(),
    git: {
      branch: null,
      commits: []
    }
  };

  if (task.create_description_file) {
    const descFile = path.join(taskDir, 'description.md');
    fs.writeFileSync(descFile, task.description || '# 任务描述\n\n');
    newTask.description_file = `tasks/${id}/description.md`;
  }

  writeYaml(path.join(taskDir, 'task.yaml'), newTask);
  return normalizeTask(newTask);
}

export function updateTask(projectPath, id, updates) {
  const taskFile = path.join(projectPath, '.xtask', 'tasks', id, 'task.yaml');
  if (!fileExists(taskFile)) return null;

  const task = normalizeTask(readYaml(taskFile));
  const { terminal, agent, git, ...restUpdates } = updates || {};

  Object.assign(task, restUpdates);
  if (terminal) {
    task.terminal = {
      ...task.terminal,
      ...terminal
    };
    task.terminal.timeout_days = Math.max(1, Math.min(30, Number(task.terminal.timeout_days) || 3));
    task.terminal.auto_stop_on_task_done = task.terminal.auto_stop_on_task_done !== false;
  }
  if (agent) {
    task.agent = {
      ...task.agent,
      ...agent
    };
  }
  if (git) {
    task.git = {
      ...task.git,
      ...git
    };
  }
  task.updated_at = new Date().toISOString();

  writeYaml(taskFile, task);
  return normalizeTask(task);
}

export function deleteTask(projectPath, id) {
  const taskDir = path.join(projectPath, '.xtask', 'tasks', id);
  if (!fileExists(taskDir)) return false;

  fs.rmSync(taskDir, { recursive: true });
  return true;
}

export function assignAgent(projectPath, id, agentInfo) {
  const taskFile = path.join(projectPath, '.xtask', 'tasks', id, 'task.yaml');
  if (!fileExists(taskFile)) return null;

  const task = normalizeTask(readYaml(taskFile));
  task.agent = {
    assigned: true,
    identity: agentInfo.identity || 'claude-opus-4',
    assigned_at: new Date().toISOString(),
    session_id: null,
    status: 'pending'
  };

  if (agentInfo.branch) {
    task.git.branch = agentInfo.branch;
  }

  writeYaml(taskFile, task);
  return normalizeTask(task);
}

export function getTaskDescription(projectPath, taskId) {
  const descFile = path.join(projectPath, '.xtask', 'tasks', taskId, 'description.md');
  if (!fileExists(descFile)) return null;
  return fs.readFileSync(descFile, 'utf-8');
}
