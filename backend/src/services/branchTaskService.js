import yaml from 'js-yaml';
import { readYaml, writeFiles, listDir } from '../utils/gitDataStore.js';
import { getWorktree } from './worktreeService.js';
import { normalizeTaskStatus } from '../utils/taskStatus.js';
import { prepareTaskDescription, prepareTaskSummary, readTaskDescriptionContent, readTaskSummaryContent } from '../utils/taskContent.js';

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

function normalizeTask(task) {
  if (!task) return null;
  task.status = normalizeTaskStatus(task.status);
  task.summary_file = task.summary_file || null;
  task.labels = normalizeTaskLabels(task.labels || []);
  task.agent = {
    assigned: false,
    identity: null,
    assigned_at: null,
    session_id: null,
    status: null,
    ...(task.agent || {})
  };
  task.git = {
    branch: null,
    commits: [],
    source_branch: null,
    ...(task.git || {})
  };
  task.terminal = {
    ...getDefaultTerminal(),
    ...(task.terminal || {})
  };
  return task;
}

function hydrateBranchTaskContent(projectPath, task, options = {}) {
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

export function buildDoneStatusSyncChanges(projectPath, task, updatedAt = new Date().toISOString()) {
  if (normalizeTaskStatus(task?.status) !== 'done') return [];

  const mainTaskPath = `tasks/${task.id}/task.yaml`;
  const mainTask = normalizeTask(readYaml(projectPath, mainTaskPath));
  if (!mainTask || mainTask.status === 'done') return [];

  mainTask.status = 'done';
  mainTask.updated_at = updatedAt;

  return [{
    path: mainTaskPath,
    content: yaml.dump(mainTask)
  }];
}

export function assignTaskToBranch(projectPath, taskId, branch, options = {}) {
  const task = readYaml(projectPath, `tasks/${taskId}/task.yaml`);
  if (!task) return null;
  normalizeTask(task);
  task.git = task.git || { branch: null, commits: [], source_branch: null };
  task.git.branch = branch;
  if (Object.prototype.hasOwnProperty.call(options, 'sourceBranch')) {
    task.git.source_branch = options.sourceBranch;
  }

  const changes = [
    {
      path: `branches/${branch}/${taskId}.yaml`,
      content: yaml.dump(task)
    }
  ];
  const worktree = getWorktree(projectPath, branch);
  if (worktree) {
    if (!Array.isArray(worktree.tasks)) {
      worktree.tasks = [];
    }
    if (!worktree.tasks.includes(taskId)) {
      worktree.tasks.push(taskId);
    }
    changes.push({
      path: `worktrees/${branch}.yaml`,
      content: yaml.dump(worktree)
    });
  }

  writeFiles(projectPath, changes, 'xtask assign task to branch');

  return task;
}

export function getBranchTasks(projectPath, branch) {
  const files = listDir(projectPath, `branches/${branch}`).filter(f => f.endsWith('.yaml'));
  return files
    .map(f => hydrateBranchTaskContent(projectPath, readYaml(projectPath, `branches/${branch}/${f}`)))
    .filter(Boolean);
}

export function getBranchTaskById(projectPath, branch, taskId, options = {}) {
  if (!branch) return null;
  const task = readYaml(projectPath, `branches/${branch}/${taskId}.yaml`);
  if (!task) return null;
  return hydrateBranchTaskContent(projectPath, task, options);
}

export function updateBranchTask(projectPath, branch, taskId, updates) {
  const task = normalizeTask(readYaml(projectPath, `branches/${branch}/${taskId}.yaml`));
  if (!task) return null;

  const nextUpdates = { ...(updates || {}) };
  const descriptionInput = Object.prototype.hasOwnProperty.call(nextUpdates, 'description')
    ? nextUpdates.description
    : undefined;
  delete nextUpdates.description;
  const summaryInput = Object.prototype.hasOwnProperty.call(nextUpdates, 'summary')
    ? nextUpdates.summary
    : undefined;
  delete nextUpdates.summary;

  Object.assign(task, nextUpdates);
  task.status = normalizeTaskStatus(task.status);
  task.labels = normalizeTaskLabels(task.labels || []);
  task.updated_at = new Date().toISOString();

  const descriptionChanges = [];
  if (descriptionInput !== undefined) {
    const preparedDescription = prepareTaskDescription(taskId, descriptionInput, {
      existingPath: task.description_file || null
    });
    task.description = preparedDescription.description;
    task.description_file = preparedDescription.description_file;
    descriptionChanges.push(...preparedDescription.changes);
  }

  const summaryChanges = [];
  if (summaryInput !== undefined) {
    const preparedSummary = prepareTaskSummary(taskId, summaryInput, {
      existingPath: task.summary_file || null
    });
    task.summary_file = preparedSummary.summary_file;
    summaryChanges.push(...preparedSummary.changes);
  }

  const syncChanges = buildDoneStatusSyncChanges(projectPath, task, task.updated_at);

  writeFiles(projectPath, [
    { path: `branches/${branch}/${taskId}.yaml`, content: yaml.dump(task) },
    ...syncChanges,
    ...descriptionChanges,
    ...summaryChanges
  ], 'xtask update branch task');
  return hydrateBranchTaskContent(projectPath, task, {
    includeDescriptionContent: true,
    includeSummaryContent: true
  });
}

export function mergeTaskToMain(projectPath, branch, taskId) {
  const task = normalizeTask(readYaml(projectPath, `branches/${branch}/${taskId}.yaml`));
  if (!task) return null;

  const changes = [
    { path: `tasks/${taskId}/task.yaml`, content: yaml.dump(task) },
    { path: `branches/${branch}/${taskId}.yaml`, delete: true }
  ];
  const worktree = getWorktree(projectPath, branch);
  if (worktree) {
    if (!Array.isArray(worktree.tasks)) {
      worktree.tasks = [];
    }
    worktree.tasks = worktree.tasks.filter(id => id !== taskId);
    changes.push({
      path: `worktrees/${branch}.yaml`,
      content: yaml.dump(worktree)
    });
  }
  writeFiles(projectPath, changes, 'xtask merge task');

  return task;
}

export function createBranchTask(projectPath, branch, taskData) {
  const timestamp = formatTimestampForId();
  const slug = String(taskData?.title || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'task';
  const id = `${timestamp}-${slug}`;

  const task = {
    id,
    title: taskData.title,
    description: '',
    description_file: null,
    summary_file: taskData.summary_file || null,
    status: normalizeTaskStatus(taskData.status),
    priority: taskData.priority || 'medium',
    milestone_id: taskData.milestone_id || null,
    parent_tasks: taskData.parent_tasks || [],
    labels: normalizeTaskLabels(taskData.labels || []),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: taskData.created_by || 'web',
    agent: {
      assigned: false,
      identity: null,
      assigned_at: null,
      session_id: null,
      status: null
    },
    terminal: getDefaultTerminal(),
    git: {
      branch,
      commits: [],
      source_branch: taskData.source_branch || null
    }
  };

  const preparedDescription = prepareTaskDescription(id, taskData.description || '', {
    forceFile: taskData.create_description_file === true,
    existingPath: taskData.description_file || null
  });
  task.description = preparedDescription.description;
  task.description_file = preparedDescription.description_file;

  const syncChanges = buildDoneStatusSyncChanges(projectPath, task, task.updated_at);

  const changes = [
    { path: `branches/${branch}/${id}.yaml`, content: yaml.dump(task) },
    ...syncChanges,
    ...preparedDescription.changes
  ];
  const worktree = getWorktree(projectPath, branch);
  if (worktree) {
    if (!Array.isArray(worktree.tasks)) {
      worktree.tasks = [];
    }
    if (!worktree.tasks.includes(id)) {
      worktree.tasks.push(id);
    }
    changes.push({
      path: `worktrees/${branch}.yaml`,
      content: yaml.dump(worktree)
    });
  }

  writeFiles(projectPath, changes, 'xtask create branch task');

  return task;
}

export function renameBranchTasks(projectPath, oldBranch, newBranch) {
  const files = listDir(projectPath, `branches/${oldBranch}`).filter(f => f.endsWith('.yaml'));
  if (files.length === 0) return [];

  const changes = [];
  const updatedTasks = [];

  files.forEach((file) => {
    const task = normalizeTask(readYaml(projectPath, `branches/${oldBranch}/${file}`));
    if (!task) return;
    task.git = task.git || {};
    task.git.branch = newBranch;
    changes.push({
      path: `branches/${newBranch}/${file}`,
      content: yaml.dump(task)
    });
    changes.push({
      path: `branches/${oldBranch}/${file}`,
      delete: true
    });
    updatedTasks.push(task);
  });

  writeFiles(projectPath, changes, 'xtask rename branch tasks');
  return updatedTasks;
}
