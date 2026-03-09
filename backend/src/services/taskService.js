import yaml from 'js-yaml';
import { readYaml, writeFiles, listDir, readFile } from '../utils/gitDataStore.js';
import { normalizeTaskStatus } from '../utils/taskStatus.js';

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

  task.status = normalizeTaskStatus(task.status);

  task.terminal = {
    ...getDefaultTerminal(),
    ...(task.terminal || {})
  };
  task.terminal.timeout_days = Math.max(1, Math.min(30, Number(task.terminal.timeout_days) || 3));
  task.terminal.auto_stop_on_task_done = task.terminal.auto_stop_on_task_done !== false;

  return task;
}

export function getTasks(projectPath, filters = {}) {
  const taskDirs = listDir(projectPath, 'tasks');
  let tasks = taskDirs.map(dir => {
    const task = readYaml(projectPath, `tasks/${dir}/task.yaml`);
    return task ? normalizeTask(task) : null;
  }).filter(Boolean);

  if (filters.milestone) {
    tasks = tasks.filter(t => t.milestone_id === filters.milestone);
  }
  if (filters.status) {
    const targetStatus = normalizeTaskStatus(filters.status, filters.status);
    tasks = tasks.filter(t => t.status === targetStatus);
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
  const task = readYaml(projectPath, `tasks/${id}/task.yaml`);
  if (!task) return null;
  return normalizeTask(task);
}

export function createTask(projectPath, task) {
  const timestamp = Date.now();
  const slug = task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const id = `${timestamp}-${slug}`;

  const newTask = {
    id,
    title: task.title,
    description: task.description || '',
    description_file: task.description_file || null,
    status: normalizeTaskStatus(task.status),
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
    newTask.description_file = `tasks/${id}/description.md`;
  }

  const changes = [
    {
      path: `tasks/${id}/task.yaml`,
      content: yaml.dump(newTask)
    }
  ];

  if (task.create_description_file) {
    changes.push({
      path: `tasks/${id}/description.md`,
      content: task.description || '# 任务描述\n\n'
    });
  }

  writeFiles(projectPath, changes, 'xtask create task');
  return normalizeTask(newTask);
}

export function updateTask(projectPath, id, updates) {
  const task = readYaml(projectPath, `tasks/${id}/task.yaml`);
  if (!task) return null;
  normalizeTask(task);
  const { terminal, agent, git, ...restUpdates } = updates || {};

  Object.assign(task, restUpdates);
  task.status = normalizeTaskStatus(task.status);
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
  writeFiles(projectPath, [
    { path: `tasks/${id}/task.yaml`, content: yaml.dump(task) }
  ], 'xtask update task');
  return normalizeTask(task);
}

export function deleteTask(projectPath, id) {
  const task = readYaml(projectPath, `tasks/${id}/task.yaml`);
  if (!task) return false;

  const changes = [
    { path: `tasks/${id}/task.yaml`, delete: true }
  ];
  const descPath = task.description_file || `tasks/${id}/description.md`;
  changes.push({ path: descPath, delete: true });
  writeFiles(projectPath, changes, 'xtask delete task');
  return true;
}

export function assignAgent(projectPath, id, agentInfo) {
  const task = readYaml(projectPath, `tasks/${id}/task.yaml`);
  if (!task) return null;
  normalizeTask(task);
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

  writeFiles(projectPath, [
    { path: `tasks/${id}/task.yaml`, content: yaml.dump(task) }
  ], 'xtask assign agent');
  return normalizeTask(task);
}

export function getTaskDescription(projectPath, taskId) {
  const task = readYaml(projectPath, `tasks/${taskId}/task.yaml`);
  const descPath = task?.description_file || `tasks/${taskId}/description.md`;
  return readFile(projectPath, descPath);
}
