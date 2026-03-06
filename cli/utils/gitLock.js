import fs from 'fs';
import path from 'path';
import { getGitCommonDir } from './gitRepo.js';

const LOCK_FILENAME = 'xtask-data.lock';
const LOCK_RETRY_MS = 50;
const LOCK_TIMEOUT_MS = 5000;
const LOCK_STALE_MS = 60000;

function sleep(ms) {
  const buffer = new SharedArrayBuffer(4);
  const view = new Int32Array(buffer);
  Atomics.wait(view, 0, 0, ms);
}

function readLockMeta(lockPath) {
  try {
    const raw = fs.readFileSync(lockPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function withGitLock(repoPath, fn) {
  const commonDir = getGitCommonDir(repoPath);
  const lockPath = path.join(commonDir, LOCK_FILENAME);
  const startedAt = Date.now();
  let acquired = false;

  while (!acquired) {
    try {
      const fd = fs.openSync(lockPath, 'wx');
      const meta = {
        pid: process.pid,
        created_at: new Date().toISOString()
      };
      fs.writeFileSync(fd, JSON.stringify(meta));
      fs.closeSync(fd);
      acquired = true;
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }

      const meta = readLockMeta(lockPath);
      if (meta?.created_at) {
        const age = Date.now() - Date.parse(meta.created_at);
        if (Number.isFinite(age) && age > LOCK_STALE_MS) {
          try {
            fs.unlinkSync(lockPath);
            continue;
          } catch {
            // 继续等待重试
          }
        }
      }

      if (Date.now() - startedAt > LOCK_TIMEOUT_MS) {
        throw new Error('获取 Git 数据锁超时，请稍后重试');
      }
      sleep(LOCK_RETRY_MS);
    }
  }

  try {
    return fn();
  } finally {
    if (acquired) {
      try {
        fs.unlinkSync(lockPath);
      } catch {
        // ignore
      }
    }
  }
}
