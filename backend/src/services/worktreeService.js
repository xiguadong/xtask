import path from 'path';
import fs from 'fs';
import { readYaml, writeYaml } from '../utils/yamlHelper.js';
import { fileExists, ensureDir, readDir } from '../utils/fileSystem.js';

export function createWorktree(projectPath, branch, worktreePath, agent) {
  const worktreesDir = path.join(projectPath, '.xtask', 'worktrees');
  ensureDir(worktreesDir);

  const worktree = {
    branch,
    worktree_path: worktreePath,
    created_at: new Date().toISOString(),
    agent: {
      identity: agent?.identity || null,
      model: agent?.model || null
    },
    status: 'active',
    tasks: [],
    last_commit: null
  };

  const branchDir = path.join(projectPath, '.xtask', 'branches', branch);
  ensureDir(branchDir);

  writeYaml(path.join(worktreesDir, `${branch}.yaml`), worktree);
  return worktree;
}

export function getWorktrees(projectPath) {
  const worktreesDir = path.join(projectPath, '.xtask', 'worktrees');
  if (!fileExists(worktreesDir)) return [];

  const files = readDir(worktreesDir).filter(f => f.endsWith('.yaml'));
  return files.map(f => readYaml(path.join(worktreesDir, f)));
}

export function getWorktree(projectPath, branch) {
  const file = path.join(projectPath, '.xtask', 'worktrees', `${branch}.yaml`);
  return fileExists(file) ? readYaml(file) : null;
}

export function updateWorktree(projectPath, branch, updates) {
  const file = path.join(projectPath, '.xtask', 'worktrees', `${branch}.yaml`);
  if (!fileExists(file)) return null;

  const worktree = readYaml(file);
  Object.assign(worktree, updates);
  writeYaml(file, worktree);
  return worktree;
}

export function deleteWorktree(projectPath, branch) {
  const file = path.join(projectPath, '.xtask', 'worktrees', `${branch}.yaml`);
  if (!fileExists(file)) return false;

  fs.unlinkSync(file);
  return true;
}
