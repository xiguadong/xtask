import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { generateTaskId } from '../utils/idGenerator.js';
import { getRepoRoot, getCurrentBranch } from '../utils/gitRepo.js';
import { listDir, readYaml as readGitYaml, writeFiles } from '../utils/gitDataStore.js';
import { normalizeTaskStatus } from '../utils/taskStatus.js';
import { prepareTaskDescription, prepareTaskSummary } from '../utils/taskContent.js';
import { archiveXtaskTodoDocs } from '../utils/xtaskTodos.js';

function normalizeTaskLabel(label) {
  return String(label || '').trim().toLowerCase();
}

function normalizeTaskLabels(labels = []) {
  return Array.from(new Set((labels || []).map((label) => normalizeTaskLabel(label)).filter(Boolean)));
}

function getWorktree(projectRoot, branch) {
  if (!branch) return null;
  return readGitYaml(projectRoot, `worktrees/${branch}.yaml`);
}

function getBranchTaskCandidates(projectRoot, branch) {
  const worktree = getWorktree(projectRoot, branch);
  const worktreeTaskIds = Array.isArray(worktree?.tasks) ? worktree.tasks.filter(Boolean) : [];
  const branchFiles = listDir(projectRoot, `branches/${branch}`).filter((file) => file.endsWith('.yaml'));
  const branchTaskIds = branchFiles.map((file) => file.replace(/\.yaml$/, ''));

  const orderedIds = [];
  const seen = new Set();
  const addId = (id) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    orderedIds.push(id);
  };

  worktreeTaskIds.forEach(addId);
  branchTaskIds.forEach(addId);

  const missing = [];
  const tasks = orderedIds
    .map((id) => {
      const task = normalizeTask(readGitYaml(projectRoot, `branches/${branch}/${id}.yaml`));
      if (!task) {
        missing.push(id);
      }
      return task;
    })
    .filter(Boolean);

  return { tasks, missing };
}

function normalizeTask(task) {
  if (!task) return null;
  task.status = normalizeTaskStatus(task.status, task.status || 'todo');
  task.summary_file = task.summary_file || null;
  task.labels = normalizeTaskLabels(task.labels || []);
  return task;
}

function printTask(task, options = {}) {
  if (options.branch) {
    console.log(`Current branch: ${options.branch}`);
  }
  console.log(`ID: ${task.id}`);
  console.log(`Title: ${task.title}`);
  console.log(`Status: ${task.status}`);
  console.log(`Priority: ${task.priority}`);
  console.log(`Milestone: ${task.milestone_id || 'None'}`);
  console.log(`Labels: ${task.labels.join(', ') || 'None'}`);
  console.log(`Summary file: ${task.summary_file || 'None'}`);
  if (task.git?.branch) {
    console.log(`Branch: ${task.git.branch}`);
  }
  if (task.git?.source_branch) {
    console.log(`Source branch: ${task.git.source_branch}`);
  }
  if (task.agent?.assigned) {
    console.log(`Agent: ${task.agent.identity} [${task.agent.status}]`);
  }
}

function readSummaryContent(summaryFile) {
  const resolvedSummaryFile = path.resolve(process.cwd(), summaryFile);
  if (!fs.existsSync(resolvedSummaryFile)) {
    console.log(`Summary file not found: ${summaryFile}`);
    return null;
  }

  return fs.readFileSync(resolvedSummaryFile, 'utf8');
}

function buildDoneStatusSyncChanges(projectRoot, task, updatedAt = new Date().toISOString()) {
  if (normalizeTaskStatus(task?.status, task?.status || 'todo') !== 'done') return [];

  const mainTaskPath = `tasks/${task.id}/task.yaml`;
  const mainTask = normalizeTask(readGitYaml(projectRoot, mainTaskPath));
  if (!mainTask || mainTask.status === 'done') return [];

  mainTask.status = 'done';
  mainTask.updated_at = updatedAt;

  return [{
    path: mainTaskPath,
    content: yaml.dump(mainTask)
  }];
}

export function createTask(title, options = {}) {
  const projectRoot = getRepoRoot();
  const currentBranch = getCurrentBranch(projectRoot);
  const worktree = getWorktree(projectRoot, currentBranch);
  const isInWorktree = Boolean(worktree);

  const id = generateTaskId(title);
  const task = {
    id,
    title,
    description: '',
    description_file: null,
    summary_file: null,
    status: normalizeTaskStatus(options.status),
    priority: options.priority || 'medium',
    milestone_id: options.milestone || null,
    parent_tasks: options.parent ? [options.parent] : [],
    labels: normalizeTaskLabels(options.labels ? options.labels.split(',') : []),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'cli',
    agent: {
      assigned: false,
      identity: null,
      assigned_at: null,
      session_id: null,
      status: null
    },
    terminal: {
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
    },
    git: {
      branch: isInWorktree ? currentBranch : null,
      commits: [],
      source_branch: isInWorktree ? 'master' : null
    }
  };

  const preparedDescription = prepareTaskDescription(id, options.description || '', {
    forceFile: options.descriptionFile === true
  });
  task.description = preparedDescription.description;
  task.description_file = preparedDescription.description_file;

  const changes = [...preparedDescription.changes];
  if (isInWorktree) {
    changes.push({
      path: `branches/${currentBranch}/${id}.yaml`,
      content: yaml.dump(task)
    });
    if (worktree) {
      if (!Array.isArray(worktree.tasks)) {
        worktree.tasks = [];
      }
      if (!worktree.tasks.includes(id)) {
        worktree.tasks.push(id);
      }
      changes.push({
        path: `worktrees/${currentBranch}.yaml`,
        content: yaml.dump(worktree)
      });
    }
  } else {
    changes.push({
      path: `tasks/${id}/task.yaml`,
      content: yaml.dump(task)
    });
  }

  writeFiles(projectRoot, changes, 'xtask create task');

  console.log(`Created task: ${id}${isInWorktree ? ` (branch: ${currentBranch})` : ''}`);
}

export function listTasks(options = {}) {
  const projectRoot = getRepoRoot();
  const currentBranch = getCurrentBranch(projectRoot);
  const worktree = getWorktree(projectRoot, currentBranch);
  const isInWorktree = Boolean(worktree);

  let tasks = [];

  if (isInWorktree) {
    const files = listDir(projectRoot, `branches/${currentBranch}`).filter(f => f.endsWith('.yaml'));
    tasks = files.map(f => normalizeTask(readGitYaml(projectRoot, `branches/${currentBranch}/${f}`))).filter(Boolean);
  } else {
    const taskDirs = listDir(projectRoot, 'tasks');
    tasks = taskDirs.map(dir => normalizeTask(readGitYaml(projectRoot, `tasks/${dir}/task.yaml`))).filter(Boolean);
  }

  let filtered = tasks;
  if (options.milestone) {
    filtered = filtered.filter(t => t.milestone_id === options.milestone);
  }
  if (options.status) {
    const targetStatus = normalizeTaskStatus(options.status, options.status);
    filtered = filtered.filter(t => t.status === targetStatus);
  }
  if (options.label) {
    const targetLabel = normalizeTaskLabel(options.label);
    filtered = filtered.filter(t => t.labels.includes(targetLabel));
  }

  if (filtered.length === 0) {
    console.log('No tasks');
    return;
  }

  filtered.forEach(t => {
    console.log(`${t.id}: ${t.title} [${t.status}]${t.milestone_id ? ` - ${t.milestone_id}` : ''}`);
  });
}

export function showTask(id) {
  const projectRoot = getRepoRoot();
  const currentBranch = getCurrentBranch(projectRoot);
  const worktree = getWorktree(projectRoot, currentBranch);
  const isInWorktree = Boolean(worktree);

  const task = normalizeTask(isInWorktree
    ? readGitYaml(projectRoot, `branches/${currentBranch}/${id}.yaml`)
    : readGitYaml(projectRoot, `tasks/${id}/task.yaml`));

  if (!task) {
    console.log('Task not found');
    return;
  }
  printTask(task);
}

export function showCurrentTask() {
  const projectRoot = getRepoRoot();
  const currentBranch = getCurrentBranch(projectRoot);

  if (!currentBranch || currentBranch === 'HEAD') {
    console.log('Current branch not found');
    return;
  }

  const directTask = normalizeTask(readGitYaml(projectRoot, `branches/${currentBranch}/${currentBranch}.yaml`));
  const { tasks, missing } = getBranchTaskCandidates(projectRoot, currentBranch);

  if (directTask) {
    printTask(directTask, { branch: currentBranch });
  } else if (tasks.length === 1) {
    printTask(tasks[0], { branch: currentBranch });
  } else if (tasks.length > 1) {
    console.log(`Current branch: ${currentBranch}`);
    console.log('Found multiple tasks in current branch, please use xtask task show <id>:');
    tasks.forEach((task) => {
      console.log(`${task.id}: ${task.title} [${task.status}]`);
    });
  } else {
    console.log(`No task found for current branch: ${currentBranch}`);
  }

  if (missing.length > 0) {
    console.log(`Missing task metadata: ${missing.join(', ')}`);
  }
}

export function updateTask(id, options = {}) {
  const projectRoot = getRepoRoot();
  const currentBranch = getCurrentBranch(projectRoot);
  const worktree = getWorktree(projectRoot, currentBranch);
  const isInWorktree = Boolean(worktree);
  const targetPath = isInWorktree
    ? `branches/${currentBranch}/${id}.yaml`
    : `tasks/${id}/task.yaml`;

  const task = normalizeTask(readGitYaml(projectRoot, targetPath));
  if (!task) {
    console.log('Task not found');
    return;
  }

  const hasSummaryOption = options.summary !== undefined;
  const hasSummaryFileOption = options.summaryFile !== undefined;

  if (hasSummaryOption && hasSummaryFileOption) {
    console.log('Error: --summary and --summary-file cannot be used together');
    return;
  }

  if (options.status) task.status = normalizeTaskStatus(options.status, task.status);
  if (options.priority) task.priority = options.priority;
  if (options.milestone !== undefined) task.milestone_id = options.milestone;
  if (options.labels) task.labels = normalizeTaskLabels(options.labels.split(','));
  task.updated_at = new Date().toISOString();

  const descriptionChanges = [];
  if (Object.prototype.hasOwnProperty.call(options, 'description')) {
    const preparedDescription = prepareTaskDescription(id, options.description, {
      existingPath: task.description_file || null
    });
    task.description = preparedDescription.description;
    task.description_file = preparedDescription.description_file;
    descriptionChanges.push(...preparedDescription.changes);
  }

  const summaryChanges = [];
  const summaryInput = hasSummaryFileOption
    ? readSummaryContent(options.summaryFile)
    : (hasSummaryOption ? options.summary : undefined);
  if (summaryInput === null) {
    return;
  }
  if (summaryInput !== undefined) {
    const preparedSummary = prepareTaskSummary(id, summaryInput, {
      existingPath: task.summary_file || null
    });
    task.summary_file = preparedSummary.summary_file;
    summaryChanges.push(...preparedSummary.changes);
  }

  const syncChanges = isInWorktree ? buildDoneStatusSyncChanges(projectRoot, task, task.updated_at) : [];

  writeFiles(projectRoot, [
    { path: targetPath, content: yaml.dump(task) },
    ...syncChanges,
    ...descriptionChanges,
    ...summaryChanges
  ], 'xtask update task');

  // 任务标记 done 时，归档 xtask_todos/ 文档到 xtask 数据分支
  if (isInWorktree && task.status === 'done') {
    const worktreePath = worktree.worktree_path
      ? (path.isAbsolute(worktree.worktree_path)
        ? worktree.worktree_path
        : path.resolve(projectRoot, worktree.worktree_path))
      : process.cwd();
    try {
      archiveXtaskTodoDocs(worktreePath, id, writeFiles, projectRoot);
      console.log(`✓ xtask_todos/ 文档已归档到数据分支`);
    } catch (err) {
      console.warn(`⚠️ xtask_todos/ 归档失败: ${err.message}`);
    }
  }

  console.log(`Updated task: ${id}${isInWorktree ? ` (branch: ${currentBranch})` : ''}`);
}

export function assignAgent(id, options = {}) {
  const projectRoot = getRepoRoot();
  const task = readGitYaml(projectRoot, `tasks/${id}/task.yaml`);
  if (!task) {
    console.log('Task not found');
    return;
  }

  task.agent = {
    assigned: true,
    identity: options.agent || 'claude-opus-4',
    assigned_at: new Date().toISOString(),
    session_id: null,
    status: 'pending'
  };

  if (options.branch) {
    task.git = task.git || {};
    task.git.branch = options.branch;
    task.git.source_branch = 'master';

    const changes = [
      { path: `branches/${options.branch}/${id}.yaml`, content: yaml.dump(task) }
    ];
    const worktree = getWorktree(projectRoot, options.branch);
    if (worktree) {
      if (!Array.isArray(worktree.tasks)) {
        worktree.tasks = [];
      }
      if (!worktree.tasks.includes(id)) {
        worktree.tasks.push(id);
      }
      changes.push({ path: `worktrees/${options.branch}.yaml`, content: yaml.dump(worktree) });
    }
    writeFiles(projectRoot, changes, 'xtask assign agent');
  } else {
    writeFiles(projectRoot, [
      { path: `tasks/${id}/task.yaml`, content: yaml.dump(task) }
    ], 'xtask assign agent');
  }

  console.log(`Assigned agent to task: ${id}`);
}

export function mergeTask(id, options = {}) {
  const projectRoot = getRepoRoot();
  const branch = options.fromBranch;

  if (!branch) {
    console.log('Error: --from-branch required');
    return;
  }

  const branchTask = readGitYaml(projectRoot, `branches/${branch}/${id}.yaml`);
  if (!branchTask) {
    console.log('Task not found in branch');
    return;
  }

  const changes = [
    { path: `tasks/${id}/task.yaml`, content: yaml.dump(branchTask) },
    { path: `branches/${branch}/${id}.yaml`, delete: true }
  ];
  const worktree = getWorktree(projectRoot, branch);
  if (worktree) {
    if (!Array.isArray(worktree.tasks)) {
      worktree.tasks = [];
    }
    worktree.tasks = worktree.tasks.filter(tid => tid !== id);
    changes.push({ path: `worktrees/${branch}.yaml`, content: yaml.dump(worktree) });
  }
  writeFiles(projectRoot, changes, 'xtask merge task');

  console.log(`Merged task ${id} from branch ${branch}`);
}

export function deleteTask(id) {
  const projectRoot = getRepoRoot();
  const currentBranch = getCurrentBranch(projectRoot);
  const worktree = getWorktree(projectRoot, currentBranch);
  const isInWorktree = Boolean(worktree);

  if (isInWorktree) {
    const task = readGitYaml(projectRoot, `branches/${currentBranch}/${id}.yaml`);
    if (!task) {
      console.log('Task not found');
      return;
    }
    const changes = [
      { path: `branches/${currentBranch}/${id}.yaml`, delete: true }
    ];
    if (task.description_file) {
      changes.push({ path: task.description_file, delete: true });
    }
    if (task.summary_file) {
      changes.push({ path: task.summary_file, delete: true });
    }
    if (worktree) {
      if (!Array.isArray(worktree.tasks)) {
        worktree.tasks = [];
      }
      worktree.tasks = worktree.tasks.filter(tid => tid !== id);
      changes.push({ path: `worktrees/${currentBranch}.yaml`, content: yaml.dump(worktree) });
    }
    writeFiles(projectRoot, changes, 'xtask delete task (branch)');
    console.log(`Deleted task: ${id} (branch: ${currentBranch})`);
    return;
  }

  const task = readGitYaml(projectRoot, `tasks/${id}/task.yaml`);
  if (!task) {
    console.log('Task not found');
    return;
  }

  const changes = [
    { path: `tasks/${id}/task.yaml`, delete: true }
  ];
  const descPath = task.description_file || `tasks/${id}/description.md`;
  changes.push({ path: descPath, delete: true });
  if (task.summary_file) {
    changes.push({ path: task.summary_file, delete: true });
  }

  writeFiles(projectRoot, changes, 'xtask delete task');
  console.log(`Deleted task: ${id}`);
}
