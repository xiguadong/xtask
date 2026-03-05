import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useTerminal } from '../hooks/useTerminal';
import { Task } from '../types';

interface TaskTerminalPanelProps {
  task: Task;
  projectName: string;
  onTaskRefresh?: () => void;
}

interface RuntimeStatus {
  active: boolean;
  taskId: string;
  sessionId?: string;
  mode?: 'local' | 'ssh';
  runtimeStatus?: 'working' | 'waiting';
  startedAt?: string;
  lastActiveAt?: string;
  terminal?: Task['terminal'];
}

export default function TaskTerminalPanel({ task, projectName, onTaskRefresh }: TaskTerminalPanelProps) {
  const { start, stop, sendInput, resize, updateConfig, getStatus, getOutput, loading } = useTerminal(projectName);
  const [mode, setMode] = useState<'local' | 'ssh'>(task.terminal.mode === 'ssh' ? 'ssh' : 'local');
  const [host, setHost] = useState(task.terminal.host || '');
  const [username, setUsername] = useState(task.terminal.username || '');
  const [port, setPort] = useState(task.terminal.port || 22);
  const [timeoutDays, setTimeoutDays] = useState(task.terminal.timeout_days || 3);
  const [autoStopOnDone, setAutoStopOnDone] = useState(task.terminal.auto_stop_on_task_done !== false);
  const [runtime, setRuntime] = useState<RuntimeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const terminalHostRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const cursorRef = useRef(0);
  const sessionRef = useRef<string | null>(null);
  const pendingInputRef = useRef('');
  const inputFlushTimerRef = useRef<number | null>(null);
  const terminalDataDisposeRef = useRef<{ dispose: () => void } | null>(null);

  useEffect(() => {
    setMode(task.terminal.mode === 'ssh' ? 'ssh' : 'local');
    setHost(task.terminal.host || '');
    setUsername(task.terminal.username || '');
    setPort(task.terminal.port || 22);
    setTimeoutDays(task.terminal.timeout_days || 3);
    setAutoStopOnDone(task.terminal.auto_stop_on_task_done !== false);
  }, [task.id, task.terminal]);

  useEffect(() => {
    if (!terminalHostRef.current || terminalRef.current) return;

    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: '"SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
      fontSize: 13,
      lineHeight: 1.3,
      convertEol: true,
      scrollback: 3000,
      theme: {
        background: '#0f172a',
        foreground: '#e2e8f0'
      }
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalHostRef.current);
    fitAddon.fit();
    terminal.writeln('终端就绪。启动后可直接输入命令。');

    const handleWindowResize = () => fitAddon.fit();
    window.addEventListener('resize', handleWindowResize);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      if (inputFlushTimerRef.current !== null) {
        window.clearTimeout(inputFlushTimerRef.current);
      }
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const refreshStatus = async () => {
      try {
        const data = await getStatus(task.id);
        if (!active) return;
        setRuntime(data);

        if (data?.active && data?.sessionId && sessionRef.current !== data.sessionId) {
          sessionRef.current = data.sessionId;
          cursorRef.current = 0;
          terminalRef.current?.reset();
          terminalRef.current?.writeln(`连接成功: ${data.mode === 'ssh' ? 'SSH' : '本地终端'}`);
        }

        if (!data?.active) {
          sessionRef.current = null;
          terminalDataDisposeRef.current?.dispose();
          terminalDataDisposeRef.current = null;
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || '获取终端状态失败');
      }
    };

    void refreshStatus();
    const timer = setInterval(refreshStatus, 2000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [getStatus, task.id]);

  useEffect(() => {
    if (!runtime?.active) return undefined;

    let active = true;
    const pullOutput = async () => {
      try {
        const data = await getOutput(task.id, cursorRef.current);
        if (!active) return;
        if (data?.output) {
          terminalRef.current?.write(data.output);
        }
        if (typeof data?.nextCursor === 'number') {
          cursorRef.current = data.nextCursor;
        }
      } catch {
        // 输出拉取失败不阻断交互
      }
    };

    void pullOutput();
    const timer = setInterval(pullOutput, 180);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [getOutput, runtime?.active, task.id]);

  useEffect(() => {
    if (!runtime?.active || !terminalRef.current) return undefined;

    terminalDataDisposeRef.current?.dispose();
    terminalDataDisposeRef.current = terminalRef.current.onData((data) => {
      if (runtime.mode === 'local') {
        if (data === '\r') {
          terminalRef.current?.write('\r\n');
        } else if (data === '\u007f') {
          terminalRef.current?.write('\b \b');
        } else if (data === '\u0003') {
          terminalRef.current?.write('^C\r\n');
        } else if (data === '\t' || (data >= ' ' && data <= '~')) {
          terminalRef.current?.write(data);
        }
      }

      pendingInputRef.current += data;
      if (inputFlushTimerRef.current !== null) return;

      inputFlushTimerRef.current = window.setTimeout(() => {
        const payload = pendingInputRef.current;
        pendingInputRef.current = '';
        inputFlushTimerRef.current = null;
        if (!payload) return;
        void sendInput(task.id, payload).catch(() => undefined);
      }, 25);
    });

    return () => {
      terminalDataDisposeRef.current?.dispose();
      terminalDataDisposeRef.current = null;
      if (inputFlushTimerRef.current !== null) {
        window.clearTimeout(inputFlushTimerRef.current);
        inputFlushTimerRef.current = null;
      }
      pendingInputRef.current = '';
    };
  }, [runtime?.active, runtime?.mode, sendInput, task.id]);

  useEffect(() => {
    if (!runtime?.active || !terminalRef.current) return;
    const cols = terminalRef.current.cols;
    const rows = terminalRef.current.rows;
    void resize(task.id, cols, rows).catch(() => undefined);
  }, [runtime?.active, resize, task.id]);

  async function handleStart() {
    setError(null);
    if (!task.git.branch) {
      setError('启动终端前请先配置 Worktree（分支名 + 工作目录）');
      return;
    }
    if (mode === 'ssh' && (!host.trim() || !username.trim())) {
      setError('SSH 模式必须填写服务器地址和用户名');
      return;
    }

    try {
      await start(task.id, {
        mode,
        timeout_days: timeoutDays,
        auto_stop_on_task_done: autoStopOnDone,
        ssh: mode === 'ssh'
          ? {
              host: host.trim(),
              username: username.trim(),
              port
            }
          : undefined
      });

      const status = await getStatus(task.id);
      setRuntime(status);
      fitAddonRef.current?.fit();
      if (terminalRef.current) {
        void resize(task.id, terminalRef.current.cols, terminalRef.current.rows).catch(() => undefined);
      }
      terminalRef.current?.focus();
      onTaskRefresh?.();
    } catch (err: any) {
      setError(err?.message || '启动终端失败');
    }
  }

  async function handleStop() {
    setError(null);
    try {
      await stop(task.id, 'manual');
      terminalDataDisposeRef.current?.dispose();
      terminalDataDisposeRef.current = null;
      const status = await getStatus(task.id);
      setRuntime(status);
      terminalRef.current?.writeln('\r\n终端已退出。');
      onTaskRefresh?.();
    } catch (err: any) {
      setError(err?.message || '停止终端失败');
    }
  }

  async function handleSaveConfig() {
    setError(null);
    try {
      await updateConfig(task.id, {
        timeout_days: timeoutDays,
        auto_stop_on_task_done: autoStopOnDone
      });
      onTaskRefresh?.();
    } catch (err: any) {
      setError(err?.message || '保存配置失败');
    }
  }

  const runtimeStatus = runtime?.runtimeStatus || (runtime?.terminal?.status as 'working' | 'waiting' | undefined);
  const active = Boolean(runtime?.active);
  const hasWorktree = Boolean(task.git.branch);

  return (
    <section className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-text">任务终端</h3>
          <p className="mt-1 text-xs text-muted">完整交互式终端，聚焦终端区域后可直接输入命令。</p>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
            active
              ? runtimeStatus === 'waiting'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-green-200 bg-green-50 text-green-700'
              : 'border-slate-200 bg-slate-100 text-slate-700'
          }`}
        >
          {!active ? '未启动' : runtimeStatus === 'waiting' ? '等待中' : '工作中'}
        </span>
      </header>

      <div className="grid gap-2 md:grid-cols-2">
        <label className="space-y-1 text-xs text-muted">
          连接类型
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as 'local' | 'ssh')}
            className="w-full rounded border border-border bg-white p-2 text-sm text-text"
            disabled={active}
          >
            <option value="local">本地终端</option>
            <option value="ssh">服务器 SSH</option>
          </select>
        </label>

        <label className="space-y-1 text-xs text-muted">
          超时天数（无活动后自动退出）
          <input
            type="number"
            min={1}
            max={30}
            value={timeoutDays}
            onChange={(event) => setTimeoutDays(Number(event.target.value) || 1)}
            className="w-full rounded border border-border bg-white p-2 text-sm text-text"
          />
        </label>
      </div>

      {mode === 'ssh' && (
        <div className="grid gap-2 md:grid-cols-3">
          <label className="space-y-1 text-xs text-muted">
            服务器地址
            <input
              value={host}
              onChange={(event) => setHost(event.target.value)}
              placeholder="例如: 10.0.0.8 或 demo.example.com"
              className="w-full rounded border border-border bg-white p-2 text-sm text-text"
              disabled={active}
            />
          </label>
          <label className="space-y-1 text-xs text-muted">
            用户名
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="例如: root"
              className="w-full rounded border border-border bg-white p-2 text-sm text-text"
              disabled={active}
            />
          </label>
          <label className="space-y-1 text-xs text-muted">
            端口
            <input
              type="number"
              value={port}
              onChange={(event) => setPort(Number(event.target.value) || 22)}
              className="w-full rounded border border-border bg-white p-2 text-sm text-text"
              disabled={active}
            />
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!active ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={loading || !hasWorktree}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {!hasWorktree ? '请先配置 Worktree' : loading ? '启动中...' : '启动终端'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStop}
            disabled={loading}
            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? '退出中...' : '退出终端'}
          </button>
        )}

        <button
          type="button"
          onClick={handleSaveConfig}
          disabled={loading}
          className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          保存终端配置
        </button>

        <button
          type="button"
          onClick={() => terminalRef.current?.focus()}
          className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted hover:bg-slate-100"
        >
          聚焦终端
        </button>

        <label className="inline-flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={autoStopOnDone}
            onChange={(event) => setAutoStopOnDone(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-border"
          />
          任务完成后自动退出终端
        </label>
      </div>

      {active && (
        <div className="rounded border border-border bg-white p-2 text-xs text-muted">
          <p>会话 ID: {runtime?.sessionId}</p>
          <p>启动时间: {runtime?.startedAt ? new Date(runtime.startedAt).toLocaleString() : '-'}</p>
          <p>最后活动: {runtime?.lastActiveAt ? new Date(runtime.lastActiveAt).toLocaleString() : '-'}</p>
        </div>
      )}

      <div className="overflow-hidden rounded border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div
          ref={terminalHostRef}
          className="h-[28rem] w-full p-2 md:h-[32rem] lg:h-[36rem]"
          onClick={() => terminalRef.current?.focus()}
        />
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
    </section>
  );
}
