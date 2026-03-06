import yaml from 'js-yaml';
import { generateTaskId } from '../utils/idGenerator.js';
import { getRepoRoot, getCurrentBranch } from '../utils/gitRepo.js';
import { listDir, readYaml as readGitYaml, writeFiles } from '../utils/gitDataStore.js';

function getWorktree(projectRoot, branch) {
  if (!branch) return null;
  return readGitYaml(projectRoot, `worktrees/${branch}.yaml`);
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
    description: options.description || '',
    description_file: options.descriptionFile ? `tasks/${id}/description.md` : null,
    status: 'todo',
    priority: options.priority || 'medium',
    milestone_id: options.milestone || null,
    parent_tasks: options.parent ? [options.parent] : [],
    labels: options.labels ? options.labels.split(',') : [],
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

  const changes = [];
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
    if (options.descriptionFile) {
      changes.push({
        path: `tasks/${id}/description.md`,
        content: '# 任务描述\n\n'
      });
    }
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
    tasks = files.map(f => readGitYaml(projectRoot, `branches/${currentBranch}/${f}`)).filter(Boolean);
  } else {
    const taskDirs = listDir(projectRoot, 'tasks');
    tasks = taskDirs.map(dir => readGitYaml(projectRoot, `tasks/${dir}/task.yaml`)).filter(Boolean);
  }

  let filtered = tasks;
  if (options.milestone) {
    filtered = filtered.filter(t => t.milestone_id === options.milestone);
  }
  if (options.status) {
    filtered = filtered.filter(t => t.status === options.status);
  }
  if (options.label) {
    filtered = filtered.filter(t => t.labels.includes(options.label));
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

  const task = isInWorktree
    ? readGitYaml(projectRoot, `branches/${currentBranch}/${id}.yaml`)
    : readGitYaml(projectRoot, `tasks/${id}/task.yaml`);

  if (!task) {
    console.log('Task not found');
    return;
  }
  console.log(`ID: ${task.id}`);
  console.log(`Title: ${task.title}`);
  console.log(`Status: ${task.status}`);
  console.log(`Priority: ${task.priority}`);
  console.log(`Milestone: ${task.milestone_id || 'None'}`);
  console.log(`Labels: ${task.labels.join(', ') || 'None'}`);
  if (task.agent.assigned) {
    console.log(`Agent: ${task.agent.identity} [${task.agent.status}]`);
    console.log(`Branch: ${task.git.branch || 'None'}`);
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

  const task = readGitYaml(projectRoot, targetPath);
  if (!task) {
    console.log('Task not found');
    return;
  }

  if (options.status) task.status = options.status;
  if (options.priority) task.priority = options.priority;
  if (options.milestone !== undefined) task.milestone_id = options.milestone;
  if (options.labels) task.labels = options.labels.split(',');
  task.updated_at = new Date().toISOString();

  writeFiles(projectRoot, [
    { path: targetPath, content: yaml.dump(task) }
  ], 'xtask update task');
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

  writeFiles(projectRoot, changes, 'xtask delete task');
  console.log(`Deleted task: ${id}`);
}
