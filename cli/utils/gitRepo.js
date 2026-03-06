import { execFileSync } from 'child_process';

function execGit(args, cwd = process.cwd()) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf-8' });
  } catch (error) {
    const stdout = typeof error.stdout === 'string'
      ? error.stdout
      : error.stdout?.toString('utf-8');
    if (error.code === 'EPERM' && error.status === 0) {
      return stdout || '';
    }
    throw error;
  }
}

export function getRepoRoot(cwd = process.cwd()) {
  try {
    return execGit(['rev-parse', '--show-toplevel'], cwd).trim();
  } catch {
    throw new Error('当前目录不是 Git 仓库');
  }
}

export function getGitCommonDir(cwd = process.cwd()) {
  return execGit(['rev-parse', '--git-common-dir'], cwd).trim();
}

export function getCurrentBranch(cwd = process.cwd()) {
  try {
    return execGit(['rev-parse', '--abbrev-ref', 'HEAD'], cwd).trim();
  } catch {
    return null;
  }
}
