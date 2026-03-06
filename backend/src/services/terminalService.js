import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import * as pty from 'node-pty';
import yaml from 'js-yaml';
import { readYaml, writeFiles } from '../utils/gitDataStore.js';
import { fileExists } from '../utils/fileSystem.js';
import { getWorktree } from './worktreeService.js';

const sessions = new Map();

const DEFAULT_TIMEOUT_DAYS = 3;
const MIN_TIMEOUT_DAYS = 1;
const MAX_TIMEOUT_DAYS = 30;
const DEFAULT_MAX_TERMINALS = 3;
const MIN_MAX_TERMINALS = 1;
const MAX_MAX_TERMINALS = 20;
const WAITING_THRESHOLD_MS = 3 * 60 * 1000;
const OUTPUT_LIMIT = 500000;
const DUPLICATE_INPUT_WINDOW_MS = 8;

const require = createRequire(import.meta.url);

function normalizeProjectPath(projectPath) {
  return path.resolve(projectPath);
}

function getTaskPath(taskId) {
  return `tasks/${taskId}/task.yaml`;
}

function sessionKey(projectPath, taskId) {
  return `${projectPath}::${taskId}`;
}

function normalizeTimeoutDays(rawValue) {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return DEFAULT_TIMEOUT_DAYS;
  return Math.min(MAX_TIMEOUT_DAYS, Math.max(MIN_TIMEOUT_DAYS, Math.floor(value)));
}

function normalizeMaxTerminals(rawValue) {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return DEFAULT_MAX_TERMINALS;
  return Math.min(MAX_MAX_TERMINALS, Math.max(MIN_MAX_TERMINALS, Math.floor(value)));
}

function getDefaultTerminal() {
  return {
    enabled: false,
    mode: null,
    session_id: null,
    status: 'stopped',
    host: null,
    port: 22,
    username: null,
    timeout_days: DEFAULT_TIMEOUT_DAYS,
    auto_stop_on_task_done: true,
    started_at: null,
    last_active_at: null,
    stopped_at: null,
    stop_reason: null
  };
}

function ensureTaskTerminal(task) {
  task.terminal = {
    ...getDefaultTerminal(),
    ...(task.terminal || {})
  };
  task.terminal.timeout_days = normalizeTimeoutDays(task.terminal.timeout_days);
  task.terminal.auto_stop_on_task_done = task.terminal.auto_stop_on_task_done !== false;
  return task.terminal;
}

function readTask(projectPath, taskId) {
  const task = readYaml(projectPath, getTaskPath(taskId));
  if (!task) return null;
  ensureTaskTerminal(task);
  return task;
}

function writeTask(projectPath, taskId, task) {
  task.updated_at = new Date().toISOString();
  writeFiles(projectPath, [
    { path: getTaskPath(taskId), content: yaml.dump(task) }
  ], 'xtask update task terminal');
}

function getRuntimeStatus(session) {
  const idleMs = Date.now() - new Date(session.lastActiveAt).getTime();
  return idleMs > WAITING_THRESHOLD_MS ? 'waiting' : 'working';
}

function buildSessionSummary(session) {
  return {
    taskId: session.taskId,
    taskTitle: session.taskTitle,
    sessionId: session.sessionId,
    mode: session.mode,
    runtimeStatus: getRuntimeStatus(session),
    startedAt: session.startedAt,
    lastActiveAt: session.lastActiveAt,
    timeoutDays: session.timeoutDays,
    autoStopOnTaskDone: session.autoStopOnTaskDone,
    ssh: session.mode === 'ssh'
      ? {
          host: session.host,
          port: session.port,
          username: session.username
        }
      : null
  };
}

function touchSession(session) {
  session.lastActiveAt = new Date().toISOString();
}

function appendOutput(session, output) {
  if (!output) return;
  session.output += output;
  if (session.output.length > OUTPUT_LIMIT) {
    const overflow = session.output.length - OUTPUT_LIMIT;
    session.output = session.output.slice(overflow);
    session.outputOffset += overflow;
  }
  touchSession(session);
}

function finalizeSession(session, reason, exitCode = null, signal = null) {
  if (session.closed) return;
  session.closed = true;

  const key = sessionKey(session.projectPath, session.taskId);
  sessions.delete(key);

  const task = readTask(session.projectPath, session.taskId);
  if (!task) return;

  const terminal = ensureTaskTerminal(task);
  terminal.enabled = false;
  terminal.session_id = null;
  terminal.status = 'stopped';
  terminal.last_active_at = session.lastActiveAt;
  terminal.stopped_at = new Date().toISOString();
  terminal.stop_reason = reason;
  terminal.exit_code = exitCode;
  terminal.exit_signal = signal;
  writeTask(session.projectPath, session.taskId, task);
}

function createProcess(spawnCwd, mode, sshOptions = {}) {
  ensurePtyHelperExecutable();

  const env = {
    ...process.env,
    TERM: process.env.TERM || 'xterm-256color'
  };

  const cols = 120;
  const rows = 36;

  if (mode === 'ssh') {
    const host = `${sshOptions.host || ''}`.trim();
    const username = `${sshOptions.username || ''}`.trim();
    const port = Number(sshOptions.port || 22);

    if (!host || !username) {
      throw new Error('SSH 模式必须提供主机和用户名');
    }

    const target = `${username}@${host}`;
    const args = ['-tt', '-p', `${port}`, target];
    const childProcess = pty.spawn('ssh', args, {
      name: env.TERM,
      cols,
      rows,
      cwd: spawnCwd,
      env
    });
    return { process: childProcess, host, username, port };
  }

  const shell = process.env.SHELL || '/bin/bash';
  const childProcess = pty.spawn(shell, ['-l'], {
    name: env.TERM,
    cols,
    rows,
    cwd: spawnCwd,
    env
  });
  return { process: childProcess, host: null, username: null, port: null };
}

function ensurePtyHelperExecutable() {
  if (process.platform === 'win32') return;
  try {
    const packageJsonPath = require.resolve('node-pty/package.json');
    const nodePtyRoot = path.dirname(packageJsonPath);
    const helperPath = path.join(nodePtyRoot, 'prebuilds', `${process.platform}-${process.arch}`, 'spawn-helper');
    if (!fs.existsSync(helperPath)) return;
    const stat = fs.statSync(helperPath);
    if ((stat.mode & 0o111) !== 0) return;
    fs.chmodSync(helperPath, stat.mode | 0o111);
  } catch {
    // chmod 失败不阻断，后续 spawn 会返回明确错误
  }
}

function getProjectActiveSessionCount(projectPath) {
  let total = 0;
  sessions.forEach((session) => {
    if (session.projectPath === projectPath) {
      total += 1;
    }
  });
  return total;
}

export function getProjectTerminalConfig(projectPath) {
  const normalized = normalizeProjectPath(projectPath);
  const config = readYaml(normalized, 'config.yaml') || {};
  const terminalConfig = config.terminal || {};

  return {
    max_terminals: normalizeMaxTerminals(terminalConfig.max_terminals)
  };
}

export function updateProjectTerminalConfig(projectPath, updates = {}) {
  const normalized = normalizeProjectPath(projectPath);
  const config = readYaml(normalized, 'config.yaml') || {};
  const current = getProjectTerminalConfig(normalized);

  config.terminal = {
    ...(config.terminal || {}),
    max_terminals: normalizeMaxTerminals(updates.max_terminals ?? current.max_terminals)
  };

  writeFiles(normalized, [
    { path: 'config.yaml', content: yaml.dump(config) }
  ], 'xtask update terminal config');
  return getProjectTerminalConfig(normalized);
}

export function startTaskTerminalSession(projectPath, taskId, options = {}) {
  const normalizedProjectPath = normalizeProjectPath(projectPath);
  const key = sessionKey(normalizedProjectPath, taskId);
  if (sessions.has(key)) {
    throw new Error('当前任务已有终端会话在运行');
  }

  const task = readTask(normalizedProjectPath, taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  const branch = task.git?.branch;
  if (!branch) {
    throw new Error('启动终端前请先配置 Worktree（分支名 + 工作目录）');
  }

  const worktree = getWorktree(normalizedProjectPath, branch);
  if (!worktree?.worktree_path) {
    throw new Error('未找到对应 Worktree，请先创建 Worktree');
  }

  const resolvedWorkdir = path.isAbsolute(worktree.worktree_path)
    ? worktree.worktree_path
    : path.resolve(normalizedProjectPath, worktree.worktree_path);

  if (!fileExists(resolvedWorkdir)) {
    throw new Error(`Worktree 目录不存在: ${resolvedWorkdir}`);
  }

  const terminalConfig = getProjectTerminalConfig(normalizedProjectPath);
  const activeSessionCount = getProjectActiveSessionCount(normalizedProjectPath);
  if (activeSessionCount >= terminalConfig.max_terminals) {
    throw new Error(`当前项目终端上限为 ${terminalConfig.max_terminals}，请先关闭一个终端`);
  }

  const terminal = ensureTaskTerminal(task);
  const mode = options.mode === 'ssh' ? 'ssh' : 'local';
  const timeoutDays = normalizeTimeoutDays(options.timeout_days ?? terminal.timeout_days);
  const autoStopOnTaskDone = options.auto_stop_on_task_done ?? terminal.auto_stop_on_task_done;

  const { process: terminalProcess, host, username, port } = createProcess(resolvedWorkdir, mode, options.ssh || {});
  const now = new Date().toISOString();
  const sessionId = `${taskId}-terminal-${Date.now()}`;

  const session = {
    projectPath: normalizedProjectPath,
    taskId,
    taskTitle: task.title,
    mode,
    host,
    username,
    port,
    sessionId,
    process: terminalProcess,
    startedAt: now,
    lastActiveAt: now,
    timeoutDays,
    autoStopOnTaskDone,
    output: '',
    outputOffset: 0,
    lastInput: null,
    lastInputAt: 0,
    closed: false,
    stopReason: null
  };

  sessions.set(key, session);

  appendOutput(
    session,
    `[系统] 终端已启动 (${mode === 'ssh' ? `SSH ${username}@${host}:${port}` : '本地 Shell'})\r\n[系统] 工作目录: ${resolvedWorkdir}\r\n`
  );

  terminalProcess.onData((data) => {
    appendOutput(session, data);
  });

  terminalProcess.onExit(({ exitCode, signal }) => {
    const reason = session.stopReason || 'process_exit';
    finalizeSession(session, reason, exitCode, signal);
  });

  terminal.enabled = true;
  terminal.mode = mode;
  terminal.session_id = sessionId;
  terminal.status = 'running';
  terminal.host = host;
  terminal.port = port || 22;
  terminal.username = username;
  terminal.timeout_days = timeoutDays;
  terminal.auto_stop_on_task_done = autoStopOnTaskDone !== false;
  terminal.started_at = now;
  terminal.last_active_at = now;
  terminal.stopped_at = null;
  terminal.stop_reason = null;
  delete terminal.exit_code;
  delete terminal.exit_signal;
  writeTask(normalizedProjectPath, taskId, task);

  return {
    active: true,
    ...buildSessionSummary(session)
  };
}

export function stopTaskTerminalSession(projectPath, taskId, reason = 'manual') {
  const normalizedProjectPath = normalizeProjectPath(projectPath);
  const key = sessionKey(normalizedProjectPath, taskId);
  const session = sessions.get(key);
  if (!session) return false;

  session.stopReason = reason;
  appendOutput(session, `\r\n[系统] 终端即将退出，原因: ${reason}\r\n`);

  try {
    session.process.kill('SIGTERM');
  } catch {
    finalizeSession(session, reason);
    return true;
  }

  setTimeout(() => {
    if (!session.closed) {
      try {
        session.process.kill('SIGKILL');
      } catch {
        finalizeSession(session, reason);
      }
    }
  }, 1500).unref();

  return true;
}

export function sendTerminalInput(projectPath, taskId, input) {
  const normalizedProjectPath = normalizeProjectPath(projectPath);
  const key = sessionKey(normalizedProjectPath, taskId);
  const session = sessions.get(key);
  if (!session) {
    throw new Error('终端会话不存在或已退出');
  }

  const payload = `${input ?? ''}`;
  const now = Date.now();
  if (payload && session.lastInput === payload && now - session.lastInputAt < DUPLICATE_INPUT_WINDOW_MS) {
    return buildSessionSummary(session);
  }
  session.lastInput = payload;
  session.lastInputAt = now;
  if (!payload) {
    return buildSessionSummary(session);
  }
  session.process.write(payload);
  touchSession(session);
  return buildSessionSummary(session);
}

export function resizeTaskTerminal(projectPath, taskId, cols, rows) {
  const normalizedProjectPath = normalizeProjectPath(projectPath);
  const key = sessionKey(normalizedProjectPath, taskId);
  const session = sessions.get(key);
  if (!session) return false;

  const safeCols = Math.max(40, Math.min(400, Number(cols) || 120));
  const safeRows = Math.max(10, Math.min(160, Number(rows) || 36));
  try {
    session.process.resize(safeCols, safeRows);
  } catch {
    // resize 失败不阻断会话
  }
  touchSession(session);
  return true;
}

export function getTaskTerminalStatus(projectPath, taskId) {
  const normalizedProjectPath = normalizeProjectPath(projectPath);
  const task = readTask(normalizedProjectPath, taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  const key = sessionKey(normalizedProjectPath, taskId);
  const session = sessions.get(key);

  if (session) {
    const summary = buildSessionSummary(session);
    return {
      active: true,
      ...summary,
      terminal: {
        ...task.terminal,
        status: summary.runtimeStatus,
        session_id: summary.sessionId,
        last_active_at: summary.lastActiveAt
      }
    };
  }

  return {
    active: false,
    taskId,
    terminal: ensureTaskTerminal(task)
  };
}

export function readTerminalOutput(projectPath, taskId, cursor = 0) {
  const normalizedProjectPath = normalizeProjectPath(projectPath);
  const key = sessionKey(normalizedProjectPath, taskId);
  const session = sessions.get(key);
  if (!session) {
    return {
      active: false,
      cursor: Number(cursor) || 0,
      nextCursor: Number(cursor) || 0,
      output: '',
      truncated: false
    };
  }

  const requested = Number(cursor);
  const safeRequested = Number.isFinite(requested) ? requested : 0;
  const safeCursor = Math.max(safeRequested, session.outputOffset);
  const nextCursor = session.outputOffset + session.output.length;
  const output = session.output.slice(safeCursor - session.outputOffset);

  return {
    active: true,
    cursor: safeCursor,
    nextCursor,
    output,
    truncated: safeRequested < session.outputOffset
  };
}

export function updateTaskTerminalConfig(projectPath, taskId, config = {}) {
  const normalizedProjectPath = normalizeProjectPath(projectPath);
  const task = readTask(normalizedProjectPath, taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  const terminal = ensureTaskTerminal(task);
  const timeoutDays = normalizeTimeoutDays(config.timeout_days ?? terminal.timeout_days);
  const autoStopOnTaskDone = config.auto_stop_on_task_done ?? terminal.auto_stop_on_task_done;

  terminal.timeout_days = timeoutDays;
  terminal.auto_stop_on_task_done = autoStopOnTaskDone !== false;
  writeTask(normalizedProjectPath, taskId, task);

  const key = sessionKey(normalizedProjectPath, taskId);
  const session = sessions.get(key);
  if (session) {
    session.timeoutDays = timeoutDays;
    session.autoStopOnTaskDone = autoStopOnTaskDone !== false;
  }

  return {
    ...terminal
  };
}

export function getProjectTerminalOverview(projectPath) {
  const normalizedProjectPath = normalizeProjectPath(projectPath);
  const projectConfig = getProjectTerminalConfig(normalizedProjectPath);
  const items = [];
  let working = 0;
  let waiting = 0;

  sessions.forEach((session) => {
    if (session.projectPath !== normalizedProjectPath) return;

    const summary = buildSessionSummary(session);
    if (summary.runtimeStatus === 'working') {
      working += 1;
    } else {
      waiting += 1;
    }

    items.push(summary);
  });

  items.sort((a, b) => (a.startedAt > b.startedAt ? -1 : 1));

  return {
    config: projectConfig,
    counts: {
      total: items.length,
      working,
      waiting,
      max: projectConfig.max_terminals,
      available: Math.max(0, projectConfig.max_terminals - items.length)
    },
    items
  };
}

function cleanupExpiredSessions() {
  const now = Date.now();
  sessions.forEach((session) => {
    const timeoutMs = session.timeoutDays * 24 * 60 * 60 * 1000;
    const lastActiveMs = new Date(session.lastActiveAt).getTime();
    if (Number.isNaN(lastActiveMs)) return;
    if (now - lastActiveMs <= timeoutMs) return;

    stopTaskTerminalSession(session.projectPath, session.taskId, 'timeout');
  });
}

setInterval(cleanupExpiredSessions, 60 * 1000).unref();
