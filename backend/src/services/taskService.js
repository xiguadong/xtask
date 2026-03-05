import path from 'path';
import fs from 'fs';
import { readYaml, writeYaml } from '../utils/yamlHelper.js';
import { fileExists, readDir, ensureDir } from '../utils/fileSystem.js';

export function getTasks(projectPath, filters = {}) {
  const tasksDir = path.join(projectPath, '.xtask', 'tasks');
  if (!fileExists(tasksDir)) return [];

  const taskDirs = readDir(tasksDir);
  let tasks = taskDirs.map(dir => {
    const taskFile = path.join(tasksDir, dir, 'task.yaml');
    return fileExists(taskFile) ? readYaml(taskFile) : null;
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
  return readYaml(taskFile);
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
      status: null
    },
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
  return newTask;
}

export function updateTask(projectPath, id, updates) {
  const taskFile = path.join(projectPath, '.xtask', 'tasks', id, 'task.yaml');
  if (!fileExists(taskFile)) return null;

  const task = readYaml(taskFile);
  Object.assign(task, updates);
  task.updated_at = new Date().toISOString();

  writeYaml(taskFile, task);
  return task;
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

  const task = readYaml(taskFile);
  task.agent = {
    assigned: true,
    identity: agentInfo.identity || 'claude-opus-4',
    assigned_at: new Date().toISOString(),
    status: 'pending'
  };

  if (agentInfo.branch) {
    task.git.branch = agentInfo.branch;
  }

  writeYaml(taskFile, task);
  return task;
}

export function getTaskDescription(projectPath, taskId) {
  const descFile = path.join(projectPath, '.xtask', 'tasks', taskId, 'description.md');
  if (!fileExists(descFile)) return null;
  return fs.readFileSync(descFile, 'utf-8');
}
