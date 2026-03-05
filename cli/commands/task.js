import fs from 'fs';
import path from 'path';
import { readYaml, writeYaml, ensureDir } from '../utils/yaml.js';
import { generateTaskId } from '../utils/idGenerator.js';

export function createTask(title, options = {}) {
  const projectPath = process.cwd();
  const tasksDir = path.join(projectPath, '.xtask', 'tasks');

  if (!fs.existsSync(tasksDir)) {
    console.log('Error: Not in an xtask project');
    return;
  }

  const id = generateTaskId(title);
  const taskDir = path.join(tasksDir, id);
  ensureDir(taskDir);

  const task = {
    id,
    title,
    description: options.description || '',
    status: 'todo',
    priority: options.priority || 'medium',
    milestone_id: options.milestone || null,
    parent_tasks: [],
    labels: options.labels ? options.labels.split(',') : [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'cli',
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

  writeYaml(path.join(taskDir, 'task.yaml'), task);
  console.log(`Created task: ${id}`);
}

export function listTasks(options = {}) {
  const projectPath = process.cwd();
  const tasksDir = path.join(projectPath, '.xtask', 'tasks');

  if (!fs.existsSync(tasksDir)) {
    console.log('Error: Not in an xtask project');
    return;
  }

  const taskDirs = fs.readdirSync(tasksDir);
  const tasks = taskDirs.map(dir => {
    const taskFile = path.join(tasksDir, dir, 'task.yaml');
    return fs.existsSync(taskFile) ? readYaml(taskFile) : null;
  }).filter(Boolean);

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
  const projectPath = process.cwd();
  const taskFile = path.join(projectPath, '.xtask', 'tasks', id, 'task.yaml');

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
  const projectPath = process.cwd();
  const taskFile = path.join(projectPath, '.xtask', 'tasks', id, 'task.yaml');

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
  console.log(`Updated task: ${id}`);
}

export function assignAgent(id, options = {}) {
  const projectPath = process.cwd();
  const taskFile = path.join(projectPath, '.xtask', 'tasks', id, 'task.yaml');

  if (!fs.existsSync(taskFile)) {
    console.log('Task not found');
    return;
  }

  const task = readYaml(taskFile);

  task.agent = {
    assigned: true,
    identity: options.agent || 'claude-opus-4',
    assigned_at: new Date().toISOString(),
    status: 'pending'
  };

  if (options.branch) {
    task.git.branch = options.branch;
  }

  writeYaml(taskFile, task);
  console.log(`Assigned agent to task: ${id}`);
}
