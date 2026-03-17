import yaml from 'js-yaml';
import { readYaml, writeFiles, listDir } from '../utils/gitDataStore.js';
import { normalizeTaskStatus } from '../utils/taskStatus.js';
import { prepareTaskDescription, prepareTaskSummary, readTaskDescriptionContent, readTaskSummaryContent } from '../utils/taskContent.js';
import { getWorktree } from './worktreeService.js';
import { getBranchTaskById } from './branchTaskService.js';

function normalizeTaskLabel(label) {
  return String(label || '').trim().toLowerCase();
}

function normalizeTaskLabels(labels = []) {
  return Array.from(new Set((labels || []).map((label) => normalizeTaskLabel(label)).filter(Boolean)));
}

function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

function formatTimestampForId(date = new Date()) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
    pad(date.getMilliseconds(), 3)
  ].join('-');
}

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
  task.summary_file = task.summary_file || null;
  task.labels = normalizeTaskLabels(task.labels || []);

  task.terminal = {
    ...getDefaultTerminal(),
    ...(task.terminal || {})
  };
  task.terminal.timeout_days = Math.max(1, Math.min(30, Number(task.terminal.timeout_days) || 3));
  task.terminal.auto_stop_on_task_done = task.terminal.auto_stop_on_task_done !== false;

  return task;
}

function hydrateTaskContent(projectPath, task, options = {}) {
  if (!task) return null;
  const hydrated = normalizeTask(task);

  if (options.includeDescriptionContent) {
    hydrated.description_content = readTaskDescriptionContent(projectPath, hydrated);
  }

  if (options.includeSummaryContent) {
    hydrated.summary_content = readTaskSummaryContent(projectPath, hydrated);
  }

  return hydrated;
}

function resolveTaskVariant(projectPath, task) {
  if (!task?.git?.branch) return task;
  return getBranchTaskById(projectPath, task.git.branch, task.id) || task;
}

export function getTasks(projectPath, filters = {}) {
  const taskDirs = listDir(projectPath, 'tasks');
  let tasks = taskDirs.map(dir => {
    const task = readYaml(projectPath, `tasks/${dir}/task.yaml`);
    return task ? hydrateTaskContent(projectPath, task) : null;
  }).filter(Boolean).map(task => resolveTaskVariant(projectPath, task));

  if (filters.milestone) {
    tasks = tasks.filter(t => t.milestone_id === filters.milestone);
  }
  if (filters.status) {
    const targetStatus = normalizeTaskStatus(filters.status, filters.status);
    tasks = tasks.filter(t => t.status === targetStatus);
  }
  if (filters.label) {
    const targetLabel = normalizeTaskLabel(filters.label);
    tasks = tasks.filter(t => t.labels.includes(targetLabel));
  }
  if (filters.branch) {
    tasks = tasks.filter(t => t.git?.branch === filters.branch);
  }

  return tasks;
}

export function getTaskById(projectPath, id) {
  const task = readYaml(projectPath, `tasks/${id}/task.yaml`);
  if (!task) return null;
  return hydrateTaskContent(projectPath, task, {
    includeDescriptionContent: true,
    includeSummaryContent: true
  });
}

export function createTask(projectPath, task) {
  const timestamp = formatTimestampForId();
  const slug = String(task?.title || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'task';
  const id = `${timestamp}-${slug}`;

  const newTask = {
    id,
    title: task.title,
    description: '',
    description_file: null,
    summary_file: task.summary_file || null,
    status: normalizeTaskStatus(task.status),
    priority: task.priority || 'medium',
    milestone_id: task.milestone_id || null,
    parent_tasks: task.parent_tasks || [],
    labels: normalizeTaskLabels(task.labels || []),
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

  const preparedDescription = prepareTaskDescription(id, task.description || '', {
    forceFile: task.create_description_file === true,
    existingPath: task.description_file || null
  });
  newTask.description = preparedDescription.description;
  newTask.description_file = preparedDescription.description_file;

  const changes = [
    {
      path: `tasks/${id}/task.yaml`,
      content: yaml.dump(newTask)
    },
    ...preparedDescription.changes
  ];

  writeFiles(projectPath, changes, 'xtask create task');
  return normalizeTask(newTask);
}

export function updateTask(projectPath, id, updates) {
  const task = readYaml(projectPath, `tasks/${id}/task.yaml`);
  if (!task) return null;
  normalizeTask(task);

  const { terminal, agent, git, ...restUpdates } = updates || {};
  const descriptionInput = Object.prototype.hasOwnProperty.call(restUpdates, 'description')
    ? restUpdates.description
    : undefined;
  delete restUpdates.description;
  const summaryInput = Object.prototype.hasOwnProperty.call(restUpdates, 'summary')
    ? restUpdates.summary
    : undefined;
  delete restUpdates.summary;

  Object.assign(task, restUpdates);
  task.status = normalizeTaskStatus(task.status);
  task.labels = normalizeTaskLabels(task.labels || []);
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

  const descriptionChanges = [];
  if (descriptionInput !== undefined) {
    const preparedDescription = prepareTaskDescription(id, descriptionInput, {
      existingPath: task.description_file || null
    });
    task.description = preparedDescription.description;
    task.description_file = preparedDescription.description_file;
    descriptionChanges.push(...preparedDescription.changes);
  }

  const summaryChanges = [];
  if (summaryInput !== undefined) {
    const preparedSummary = prepareTaskSummary(id, summaryInput, {
      existingPath: task.summary_file || null
    });
    task.summary_file = preparedSummary.summary_file;
    summaryChanges.push(...preparedSummary.changes);
  }

  writeFiles(projectPath, [
    { path: `tasks/${id}/task.yaml`, content: yaml.dump(task) },
    ...descriptionChanges,
    ...summaryChanges
  ], 'xtask update task');

  return hydrateTaskContent(projectPath, task, {
    includeDescriptionContent: true,
    includeSummaryContent: true
  });
}

export function deleteTask(projectPath, id) {
  const task = readYaml(projectPath, `tasks/${id}/task.yaml`);
  if (!task) return false;
  normalizeTask(task);

  const changes = [
    { path: `tasks/${id}/task.yaml`, delete: true }
  ];
  const descPath = task.description_file || `tasks/${id}/description.md`;
  changes.push({ path: descPath, delete: true });
  if (task.summary_file) {
    changes.push({ path: task.summary_file, delete: true });
  }

  const branches = listDir(projectPath, 'branches');
  branches.forEach((branch) => {
    const branchTask = readYaml(projectPath, `branches/${branch}/${id}.yaml`);
    if (!branchTask) return;

    changes.push({ path: `branches/${branch}/${id}.yaml`, delete: true });

    if (branchTask.description_file) {
      changes.push({ path: branchTask.description_file, delete: true });
    }
    if (branchTask.summary_file) {
      changes.push({ path: branchTask.summary_file, delete: true });
    }

    const worktree = getWorktree(projectPath, branch);
    if (!worktree) return;

    const nextTasks = Array.isArray(worktree.tasks)
      ? worktree.tasks.filter((taskId) => taskId !== id)
      : [];

    changes.push({
      path: `worktrees/${branch}.yaml`,
      content: yaml.dump({
        ...worktree,
        tasks: nextTasks
      })
    });
  });

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
  return readTaskDescriptionContent(projectPath, task);
}
