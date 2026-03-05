import path from 'path';
import fs from 'fs';
import { readYaml, writeYaml } from '../utils/yamlHelper.js';
import { fileExists, ensureDir, readDir } from '../utils/fileSystem.js';
import { getWorktree, updateWorktree } from './worktreeService.js';

export function assignTaskToBranch(projectPath, taskId, branch) {
  const taskFile = path.join(projectPath, '.xtask', 'tasks', taskId, 'task.yaml');
  if (!fileExists(taskFile)) return null;

  const task = readYaml(taskFile);
  task.git.branch = branch;
  task.git.source_branch = 'master';

  const branchDir = path.join(projectPath, '.xtask', 'branches', branch);
  ensureDir(branchDir);
  writeYaml(path.join(branchDir, `${taskId}.yaml`), task);

  const worktree = getWorktree(projectPath, branch);
  if (worktree && !worktree.tasks.includes(taskId)) {
    worktree.tasks.push(taskId);
    updateWorktree(projectPath, branch, worktree);
  }

  return task;
}

export function getBranchTasks(projectPath, branch) {
  const branchDir = path.join(projectPath, '.xtask', 'branches', branch);
  if (!fileExists(branchDir)) return [];

  const files = readDir(branchDir).filter(f => f.endsWith('.yaml'));
  return files.map(f => readYaml(path.join(branchDir, f)));
}

export function updateBranchTask(projectPath, branch, taskId, updates) {
  const taskFile = path.join(projectPath, '.xtask', 'branches', branch, `${taskId}.yaml`);
  if (!fileExists(taskFile)) return null;

  const task = readYaml(taskFile);
  Object.assign(task, updates);
  task.updated_at = new Date().toISOString();
  writeYaml(taskFile, task);
  return task;
}

export function mergeTaskToMain(projectPath, branch, taskId) {
  const branchFile = path.join(projectPath, '.xtask', 'branches', branch, `${taskId}.yaml`);
  if (!fileExists(branchFile)) return null;

  const task = readYaml(branchFile);
  const mainDir = path.join(projectPath, '.xtask', 'tasks', taskId);
  ensureDir(mainDir);
  writeYaml(path.join(mainDir, 'task.yaml'), task);

  fs.unlinkSync(branchFile);

  const worktree = getWorktree(projectPath, branch);
  if (worktree) {
    worktree.tasks = worktree.tasks.filter(id => id !== taskId);
    updateWorktree(projectPath, branch, worktree);
  }

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
    status: taskData.status || 'todo',
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
      status: null
    },
    git: {
      branch,
      commits: [],
      source_branch: 'master'
    }
  };

  const branchDir = path.join(projectPath, '.xtask', 'branches', branch);
  ensureDir(branchDir);
  writeYaml(path.join(branchDir, `${id}.yaml`), task);

  const worktree = getWorktree(projectPath, branch);
  if (worktree && !worktree.tasks.includes(id)) {
    worktree.tasks.push(id);
    updateWorktree(projectPath, branch, worktree);
  }

  return task;
}

export function renameBranchTasks(projectPath, oldBranch, newBranch) {
  const branchDir = path.join(projectPath, '.xtask', 'branches', newBranch);
  if (!fileExists(branchDir)) return [];

  const files = readDir(branchDir).filter(f => f.endsWith('.yaml'));
  const updatedTasks = [];

  files.forEach(file => {
    const taskFile = path.join(branchDir, file);
    const task = readYaml(taskFile);
    task.git.branch = newBranch;
    writeYaml(taskFile, task);
    updatedTasks.push(task);
  });

  return updatedTasks;
}
