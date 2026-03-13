import path from 'path';
import { execFileSync } from 'child_process';
import yaml from 'js-yaml';
import { readYaml, writeFiles, listDir } from '../utils/gitDataStore.js';
import { ensureDir } from '../utils/fileSystem.js';
import { detectDefaultBranch } from '../utils/gitRepo.js';

export function createWorktree(projectPath, branch, worktreePath, agent, sourceBranch) {
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

  sourceBranch = sourceBranch || detectDefaultBranch(projectPath) || 'main';

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
    source_branch: sourceBranch,
    created_at: new Date().toISOString(),
    agent: {
      identity: agent?.identity || null,
      model: agent?.model || null
    },
    status: 'active',
    tasks: [],
    last_commit: null
  };

  writeFiles(projectPath, [
    { path: `worktrees/${branch}.yaml`, content: yaml.dump(worktree) }
  ], 'xtask create worktree');
  return worktree;
}

export function getWorktrees(projectPath) {
  const files = listDir(projectPath, 'worktrees').filter(f => f.endsWith('.yaml'));
  return files.map(f => readYaml(projectPath, `worktrees/${f}`)).filter(Boolean);
}

export function getWorktree(projectPath, branch) {
  return readYaml(projectPath, `worktrees/${branch}.yaml`);
}

export function updateWorktree(projectPath, branch, updates) {
  const worktree = readYaml(projectPath, `worktrees/${branch}.yaml`);
  if (!worktree) return null;
  Object.assign(worktree, updates);
  writeFiles(projectPath, [
    { path: `worktrees/${branch}.yaml`, content: yaml.dump(worktree) }
  ], 'xtask update worktree');
  return worktree;
}

export function deleteWorktree(projectPath, branch) {
  const worktree = readYaml(projectPath, `worktrees/${branch}.yaml`);
  if (!worktree) return false;
  writeFiles(projectPath, [
    { path: `worktrees/${branch}.yaml`, delete: true }
  ], 'xtask delete worktree');
  return true;
}

export function renameWorktree(projectPath, oldBranch, newBranch) {
  const worktree = readYaml(projectPath, `worktrees/${oldBranch}.yaml`);
  if (!worktree) return null;
  const existing = readYaml(projectPath, `worktrees/${newBranch}.yaml`);
  if (existing) throw new Error('Target branch already exists');

  worktree.branch = newBranch;
  writeFiles(projectPath, [
    { path: `worktrees/${newBranch}.yaml`, content: yaml.dump(worktree) },
    { path: `worktrees/${oldBranch}.yaml`, delete: true }
  ], 'xtask rename worktree');

  return worktree;
}
