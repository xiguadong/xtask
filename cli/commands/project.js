import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import { getProjects, saveProjects } from '../utils/config.js';
import { getRepoRoot } from '../utils/gitRepo.js';
import { writeFiles } from '../utils/gitDataStore.js';

export function registerProject() {
  let absPath;
  try {
    absPath = getRepoRoot();
  } catch (error) {
    console.log(error.message);
    return;
  }
  const name = path.basename(absPath);

  const projects = getProjects();
  if (projects.find(p => p.path === absPath)) {
    console.log('Project already registered');
    return;
  }

  projects.push({
    name,
    path: absPath,
    created_at: new Date().toISOString(),
    hidden: false
  });

  saveProjects(projects);
  console.log(`Registered project: ${name}`);
}

export function listProjects() {
  const projects = getProjects().filter(p => !p.hidden);
  if (projects.length === 0) {
    console.log('No projects registered');
    return;
  }

  projects.forEach(p => {
    console.log(`${p.name} - ${p.path}`);
  });
}

export function deleteProject(name) {
  const projects = getProjects();
  const project = projects.find(p => p.name === name);

  if (!project) {
    console.log('Project not found');
    return;
  }

  project.hidden = true;
  saveProjects(projects);
  console.log(`Deleted project: ${name}`);
}

export function migrateProjectToGit() {
  let repoRoot;
  try {
    repoRoot = getRepoRoot();
  } catch (error) {
    console.log(error.message);
    return;
  }

  const xtaskDir = path.join(repoRoot, '.xtask');
  if (!fs.existsSync(xtaskDir)) {
    console.log('未找到 .xtask 目录，无法迁移');
    return;
  }

  const changes = [];

  const milestonesFile = path.join(xtaskDir, 'milestones.yaml');
  if (fs.existsSync(milestonesFile)) {
    changes.push({
      path: 'milestones.yaml',
      content: fs.readFileSync(milestonesFile, 'utf-8')
    });
  }

  const configFile = path.join(xtaskDir, 'config.yaml');
  if (fs.existsSync(configFile)) {
    changes.push({
      path: 'config.yaml',
      content: fs.readFileSync(configFile, 'utf-8')
    });
  } else {
    changes.push({
      path: 'config.yaml',
      content: yaml.dump({})
    });
  }

  const tasksDir = path.join(xtaskDir, 'tasks');
  if (fs.existsSync(tasksDir)) {
    const taskDirs = fs.readdirSync(tasksDir);
    taskDirs.forEach((taskId) => {
      const taskFile = path.join(tasksDir, taskId, 'task.yaml');
      if (fs.existsSync(taskFile)) {
        changes.push({
          path: `tasks/${taskId}/task.yaml`,
          content: fs.readFileSync(taskFile, 'utf-8')
        });
      }
      const descFile = path.join(tasksDir, taskId, 'description.md');
      if (fs.existsSync(descFile)) {
        changes.push({
          path: `tasks/${taskId}/description.md`,
          content: fs.readFileSync(descFile, 'utf-8')
        });
      }
    });
  }

  const branchesDir = path.join(xtaskDir, 'branches');
  if (fs.existsSync(branchesDir)) {
    const branchDirs = fs.readdirSync(branchesDir);
    branchDirs.forEach((branch) => {
      const branchPath = path.join(branchesDir, branch);
      if (!fs.statSync(branchPath).isDirectory()) return;
      const files = fs.readdirSync(branchPath).filter(f => f.endsWith('.yaml'));
      files.forEach((file) => {
        const filePath = path.join(branchPath, file);
        changes.push({
          path: `branches/${branch}/${file}`,
          content: fs.readFileSync(filePath, 'utf-8')
        });
      });
    });
  }

  const worktreesDir = path.join(xtaskDir, 'worktrees');
  if (fs.existsSync(worktreesDir)) {
    const files = fs.readdirSync(worktreesDir).filter(f => f.endsWith('.yaml'));
    files.forEach((file) => {
      const filePath = path.join(worktreesDir, file);
      changes.push({
        path: `worktrees/${file}`,
        content: fs.readFileSync(filePath, 'utf-8')
      });
    });
  }

  if (changes.length === 0) {
    console.log('没有可迁移的数据');
    return;
  }

  writeFiles(repoRoot, changes, 'xtask migrate data to git');
  fs.rmSync(xtaskDir, { recursive: true, force: true });
  console.log('✓ 已迁移到 Git 数据分支，并删除本地 .xtask');
}
