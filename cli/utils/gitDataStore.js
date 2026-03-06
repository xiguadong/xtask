import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { withGitLock } from './gitLock.js';

const DATA_REF = 'refs/xtask-data';

function runGit(repoPath, args, options = {}) {
  const { suppressStderr, ...execOptions } = options;
  const stdio = suppressStderr ? ['ignore', 'pipe', 'ignore'] : undefined;
  try {
    return execFileSync('git', args, {
      cwd: repoPath,
      encoding: 'utf-8',
      stdio,
      ...execOptions
    });
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

function normalizeRelPath(relPath) {
  return relPath.replace(/^\/+/, '').replace(/\\/g, '/');
}

export function getDataRef() {
  return DATA_REF;
}

export function getRefCommit(repoPath) {
  try {
    return runGit(repoPath, ['rev-parse', '--verify', '--quiet', DATA_REF]).trim();
  } catch {
    return null;
  }
}

export function readFile(repoPath, relPath) {
  const commit = getRefCommit(repoPath);
  if (!commit) return null;
  const normalized = normalizeRelPath(relPath);
  try {
    return runGit(repoPath, ['show', `${DATA_REF}:${normalized}`], { suppressStderr: true });
  } catch {
    return null;
  }
}

export function readYaml(repoPath, relPath) {
  const content = readFile(repoPath, relPath);
  if (!content) return null;
  return yaml.load(content);
}

export function listDir(repoPath, relDir = '') {
  const commit = getRefCommit(repoPath);
  if (!commit) return [];
  const normalized = relDir ? normalizeRelPath(relDir) : '';
  const target = normalized ? `${DATA_REF}:${normalized}` : DATA_REF;
  try {
    const output = runGit(repoPath, ['ls-tree', '--name-only', target], { suppressStderr: true }).trim();
    if (!output) return [];
    return output.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function createIndexFile(repoPath) {
  const gitDirRaw = runGit(repoPath, ['rev-parse', '--git-common-dir']).trim();
  const gitDir = path.isAbsolute(gitDirRaw) ? gitDirRaw : path.join(repoPath, gitDirRaw);
  const filename = `xtask-index-${process.pid}-${Date.now()}`;
  return path.join(gitDir, filename);
}

function createTempContentFile(repoPath, content) {
  const gitDirRaw = runGit(repoPath, ['rev-parse', '--git-common-dir']).trim();
  const gitDir = path.isAbsolute(gitDirRaw) ? gitDirRaw : path.join(repoPath, gitDirRaw);
  const filename = `xtask-content-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const filePath = path.join(gitDir, filename);
  fs.writeFileSync(filePath, content ?? '', 'utf-8');
  return filePath;
}

export function writeFiles(repoPath, changes, message = 'xtask data update') {
  if (!Array.isArray(changes) || changes.length === 0) return null;

  return withGitLock(repoPath, () => {
    const oldCommit = getRefCommit(repoPath);
    const indexFile = createIndexFile(repoPath);
    const env = {
      ...process.env,
      GIT_INDEX_FILE: indexFile,
      GIT_AUTHOR_NAME: 'xtask',
      GIT_AUTHOR_EMAIL: 'xtask@local',
      GIT_COMMITTER_NAME: 'xtask',
      GIT_COMMITTER_EMAIL: 'xtask@local'
    };

    try {
      if (oldCommit) {
        runGit(repoPath, ['read-tree', `${oldCommit}^{tree}`], { env });
      } else {
        runGit(repoPath, ['read-tree', '--empty'], { env });
      }

      changes.forEach((change) => {
        const targetPath = normalizeRelPath(change.path || '');
        if (!targetPath) return;
        if (change.delete) {
          try {
            runGit(repoPath, ['update-index', '--remove', '--', targetPath], { env });
          } catch {
            // ignore missing paths
          }
          return;
        }

        const content = change.content ?? '';
        const tempFile = createTempContentFile(repoPath, content);
        try {
          const blob = runGit(repoPath, ['hash-object', '-w', tempFile], { env }).trim();
          runGit(repoPath, ['update-index', '--add', '--cacheinfo', '100644', blob, targetPath], { env });
        } finally {
          try {
            fs.unlinkSync(tempFile);
          } catch {
            // ignore
          }
        }
      });

      const tree = runGit(repoPath, ['write-tree'], { env }).trim();
      const commitArgs = ['commit-tree', tree, '-m', message];
      if (oldCommit) {
        commitArgs.push('-p', oldCommit);
      }
      const newCommit = runGit(repoPath, commitArgs, { env }).trim();

      if (oldCommit) {
        runGit(repoPath, ['update-ref', DATA_REF, newCommit, oldCommit], { env });
      } else {
        runGit(repoPath, ['update-ref', DATA_REF, newCommit], { env });
      }

      return newCommit;
    } finally {
      try {
        fs.unlinkSync(indexFile);
      } catch {
        // ignore
      }
    }
  });
}

export function writeYaml(repoPath, relPath, data, message) {
  return writeFiles(repoPath, [
    {
      path: relPath,
      content: yaml.dump(data)
    }
  ], message);
}

export function deletePath(repoPath, relPath, message) {
  return writeFiles(repoPath, [
    {
      path: relPath,
      delete: true
    }
  ], message);
}
