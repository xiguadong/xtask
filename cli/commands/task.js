import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { readYaml, writeYaml, ensureDir } from '../utils/yaml.js';
import { generateTaskId } from '../utils/idGenerator.js';

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

function getProjectRoot() {
  let dir = process.cwd();
  while (dir !== '/') {
    if (fs.existsSync(path.join(dir, '.xtask'))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

export function createTask(title, options = {}) {
  const projectRoot = getProjectRoot();
  const currentBranch = getCurrentBranch();
  const worktreeFile = currentBranch ? path.join(projectRoot, '.xtask', 'worktrees', `${currentBranch}.yaml`) : null;
  const isInWorktree = worktreeFile && fs.existsSync(worktreeFile);

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

  if (isInWorktree) {
    const branchDir = path.join(projectRoot, '.xtask', 'branches', currentBranch);
    ensureDir(branchDir);
    writeYaml(path.join(branchDir, `${id}.yaml`), task);

    const worktree = readYaml(worktreeFile);
    if (!worktree.tasks.includes(id)) {
      worktree.tasks.push(id);
      writeYaml(worktreeFile, worktree);
    }
  } else {
    const taskDir = path.join(projectRoot, '.xtask', 'tasks', id);
    ensureDir(taskDir);
    writeYaml(path.join(taskDir, 'task.yaml'), task);

    if (options.descriptionFile) {
      fs.writeFileSync(path.join(taskDir, 'description.md'), '# 任务描述\n\n');
    }
  }

  console.log(`Created task: ${id}${isInWorktree ? ` (branch: ${currentBranch})` : ''}`);
}

export function listTasks(options = {}) {
  const projectRoot = getProjectRoot();
  const currentBranch = getCurrentBranch();
  const worktreeFile = currentBranch ? path.join(projectRoot, '.xtask', 'worktrees', `${currentBranch}.yaml`) : null;
  const isInWorktree = worktreeFile && fs.existsSync(worktreeFile);

  let tasks = [];

  if (isInWorktree) {
    const branchDir = path.join(projectRoot, '.xtask', 'branches', currentBranch);
    if (fs.existsSync(branchDir)) {
      const files = fs.readdirSync(branchDir).filter(f => f.endsWith('.yaml'));
      tasks = files.map(f => readYaml(path.join(branchDir, f)));
    }
  } else {
    const tasksDir = path.join(projectRoot, '.xtask', 'tasks');
    if (fs.existsSync(tasksDir)) {
      const taskDirs = fs.readdirSync(tasksDir);
      tasks = taskDirs.map(dir => {
        const taskFile = path.join(tasksDir, dir, 'task.yaml');
        return fs.existsSync(taskFile) ? readYaml(taskFile) : null;
      }).filter(Boolean);
    }
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
  const projectRoot = getProjectRoot();
  const currentBranch = getCurrentBranch();
  const worktreeFile = currentBranch ? path.join(projectRoot, '.xtask', 'worktrees', `${currentBranch}.yaml`) : null;
  const isInWorktree = worktreeFile && fs.existsSync(worktreeFile);

  let taskFile;
  if (isInWorktree) {
    taskFile = path.join(projectRoot, '.xtask', 'branches', currentBranch, `${id}.yaml`);
  } else {
    taskFile = path.join(projectRoot, '.xtask', 'tasks', id, 'task.yaml');
  }

  if (!fs.existsSync(taskFile)) {
    console.log('Task not found');
    return;
  }

  const task = readYaml(taskFile);
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
  const projectRoot = getProjectRoot();
  const currentBranch = getCurrentBranch();
  const worktreeFile = currentBranch ? path.join(projectRoot, '.xtask', 'worktrees', `${currentBranch}.yaml`) : null;
  const isInWorktree = worktreeFile && fs.existsSync(worktreeFile);

  let taskFile;
  if (isInWorktree) {
    taskFile = path.join(projectRoot, '.xtask', 'branches', currentBranch, `${id}.yaml`);
  } else {
    taskFile = path.join(projectRoot, '.xtask', 'tasks', id, 'task.yaml');
  }

  if (!fs.existsSync(taskFile)) {
    console.log('Task not found');
    return;
  }

  const task = readYaml(taskFile);

  if (options.status) task.status = options.status;
  if (options.priority) task.priority = options.priority;
  if (options.milestone !== undefined) task.milestone_id = options.milestone;
  if (options.labels) task.labels = options.labels.split(',');
  task.updated_at = new Date().toISOString();

  writeYaml(taskFile, task);
  console.log(`Updated task: ${id}${isInWorktree ? ` (branch: ${currentBranch})` : ''}`);
}

export function assignAgent(id, options = {}) {
  const projectRoot = getProjectRoot();
  const taskFile = path.join(projectRoot, '.xtask', 'tasks', id, 'task.yaml');

  if (!fs.existsSync(taskFile)) {
    console.log('Task not found');
    return;
  }

  const task = readYaml(taskFile);

  task.agent = {
    assigned: true,
    identity: options.agent || 'claude-opus-4',
    assigned_at: new Date().toISOString(),
    session_id: null,
    status: 'pending'
  };

  if (options.branch) {
    task.git.branch = options.branch;
    task.git.source_branch = 'master';

    const branchDir = path.join(projectRoot, '.xtask', 'branches', options.branch);
    ensureDir(branchDir);
    writeYaml(path.join(branchDir, `${id}.yaml`), task);

    const worktreeFile = path.join(projectRoot, '.xtask', 'worktrees', `${options.branch}.yaml`);
    if (fs.existsSync(worktreeFile)) {
      const worktree = readYaml(worktreeFile);
      if (!worktree.tasks.includes(id)) {
        worktree.tasks.push(id);
        writeYaml(worktreeFile, worktree);
      }
    }
  } else {
    writeYaml(taskFile, task);
  }

  console.log(`Assigned agent to task: ${id}`);
}

export function mergeTask(id, options = {}) {
  const projectRoot = getProjectRoot();
  const branch = options.fromBranch;

  if (!branch) {
    console.log('Error: --from-branch required');
    return;
  }

  const branchFile = path.join(projectRoot, '.xtask', 'branches', branch, `${id}.yaml`);
  if (!fs.existsSync(branchFile)) {
    console.log('Task not found in branch');
    return;
  }

  const task = readYaml(branchFile);
  const mainDir = path.join(projectRoot, '.xtask', 'tasks', id);
  ensureDir(mainDir);
  writeYaml(path.join(mainDir, 'task.yaml'), task);

  fs.unlinkSync(branchFile);

  const worktreeFile = path.join(projectRoot, '.xtask', 'worktrees', `${branch}.yaml`);
  if (fs.existsSync(worktreeFile)) {
    const worktree = readYaml(worktreeFile);
    worktree.tasks = worktree.tasks.filter(tid => tid !== id);
    writeYaml(worktreeFile, worktree);
  }

  console.log(`Merged task ${id} from branch ${branch}`);
}
