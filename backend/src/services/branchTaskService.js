import yaml from 'js-yaml';
import { readYaml, writeFiles, listDir } from '../utils/gitDataStore.js';
import { getWorktree } from './worktreeService.js';
import { normalizeTaskStatus } from '../utils/taskStatus.js';

function normalizeTask(task) {
  if (!task) return null;
  task.status = normalizeTaskStatus(task.status);
  return task;
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
  return files.map(f => normalizeTask(readYaml(projectPath, `branches/${branch}/${f}`))).filter(Boolean);
}

export function updateBranchTask(projectPath, branch, taskId, updates) {
  const task = normalizeTask(readYaml(projectPath, `branches/${branch}/${taskId}.yaml`));
  if (!task) return null;
  Object.assign(task, updates);
  task.status = normalizeTaskStatus(task.status);
  task.updated_at = new Date().toISOString();
  writeFiles(projectPath, [
    { path: `branches/${branch}/${taskId}.yaml`, content: yaml.dump(task) }
  ], 'xtask update branch task');
  return task;
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
  const timestamp = Date.now();
  const slug = taskData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const id = `${timestamp}-${slug}`;

  const task = {
    id,
    title: taskData.title,
    description: taskData.description || '',
    description_file: taskData.description_file || null,
    status: normalizeTaskStatus(taskData.status),
    priority: taskData.priority || 'medium',
    milestone_id: taskData.milestone_id || null,
    parent_tasks: taskData.parent_tasks || [],
    labels: taskData.labels || [],
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

  const changes = [
    { path: `branches/${branch}/${id}.yaml`, content: yaml.dump(task) }
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
