import { execFileSync } from 'child_process';

export function getRepoRoot(cwd = process.cwd()) {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd,
      encoding: 'utf-8'
    }).trim();
  } catch {
    throw new Error('当前目录不是 Git 仓库');
  }
}

export function getGitCommonDir(cwd = process.cwd()) {
  return execFileSync('git', ['rev-parse', '--git-common-dir'], {
    cwd,
    encoding: 'utf-8'
  }).trim();
}

export function getCurrentBranch(cwd = process.cwd()) {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd,
      encoding: 'utf-8'
    }).trim();
  } catch {
    return null;
  }
}
