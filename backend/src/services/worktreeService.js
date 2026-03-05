import path from 'path';
import fs from 'fs';
import { execFileSync, execSync } from 'child_process';
import { readYaml, writeYaml } from '../utils/yamlHelper.js';
import { fileExists, ensureDir, readDir } from '../utils/fileSystem.js';

export function createWorktree(projectPath, branch, worktreePath, agent, sourceBranch) {
  const worktreesDir = path.join(projectPath, '.xtask', 'worktrees');
  ensureDir(worktreesDir);

  const resolvedWorktreePath = path.isAbsolute(worktreePath)
    ? worktreePath
    : path.resolve(projectPath, worktreePath);

  if (resolvedWorktreePath === '/tmp' || resolvedWorktreePath.startsWith('/tmp/')) {
    throw new Error('禁止使用 /tmp 作为 worktree 目录，请使用项目内的 cache/worktrees 等路径');
  }

  const parentDir = path.dirname(resolvedWorktreePath);
  if (parentDir && parentDir !== resolvedWorktreePath) {
    ensureDir(parentDir);
  }

  const storedWorktreePath = (() => {
    const relative = path.relative(projectPath, resolvedWorktreePath);
    if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
      return relative;
    }
    return resolvedWorktreePath;
  })();

  // 自动检测主分支
  if (!sourceBranch) {
    try {
      sourceBranch = execSync('git symbolic-ref refs/remotes/origin/HEAD', { cwd: projectPath, encoding: 'utf-8' })
        .trim().replace('refs/remotes/origin/', '');
    } catch {
      sourceBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: projectPath, encoding: 'utf-8' }).trim();
    }
  }

  // 创建 git worktree
  try {
    execFileSync('git', ['worktree', 'add', '-b', branch, resolvedWorktreePath, sourceBranch], {
      cwd: projectPath,
      stdio: 'inherit'
    });
  } catch (error) {
    throw new Error(`Failed to create git worktree: ${error.message}`);
  }

  const worktree = {
    branch,
    worktree_path: storedWorktreePath,
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

export function renameWorktree(projectPath, oldBranch, newBranch) {
  const oldFile = path.join(projectPath, '.xtask', 'worktrees', `${oldBranch}.yaml`);
  const newFile = path.join(projectPath, '.xtask', 'worktrees', `${newBranch}.yaml`);

  if (!fileExists(oldFile)) return null;
  if (fileExists(newFile)) throw new Error('Target branch already exists');

  const worktree = readYaml(oldFile);
  worktree.branch = newBranch;
  writeYaml(newFile, worktree);
  fs.unlinkSync(oldFile);

  const oldBranchDir = path.join(projectPath, '.xtask', 'branches', oldBranch);
  const newBranchDir = path.join(projectPath, '.xtask', 'branches', newBranch);
  if (fileExists(oldBranchDir)) {
    fs.renameSync(oldBranchDir, newBranchDir);
  }

  return worktree;
}
