import { execFileSync } from 'child_process';

function runGit(projectPath, args) {
  try {
    return execFileSync('git', args, {
      cwd: projectPath,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return null;
  }
}

export function detectDefaultBranch(projectPath) {
  const remoteHead = runGit(projectPath, ['symbolic-ref', 'refs/remotes/origin/HEAD']);
  if (remoteHead) {
    const branch = remoteHead.replace('refs/remotes/origin/', '');
    const remoteExists = runGit(projectPath, ['show-ref', '--verify', `refs/remotes/origin/${branch}`]);
    const localExists = runGit(projectPath, ['show-ref', '--verify', `refs/heads/${branch}`]);
    if (remoteExists || localExists) {
      return branch;
    }
  }

  for (const branch of ['main', 'master']) {
    const exists = runGit(projectPath, ['show-ref', '--verify', `refs/heads/${branch}`]);
    if (exists) {
      return branch;
    }
  }

  const currentBranch = runGit(projectPath, ['rev-parse', '--abbrev-ref', 'HEAD']);
  return currentBranch && currentBranch !== 'HEAD' ? currentBranch : null;
}
