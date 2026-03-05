import { useState } from 'react';
import { useAgent } from '../hooks/useAgent';
import { useWorktrees } from '../hooks/useWorktrees';
import { Task } from '../types';

interface TaskActionsProps {
  task: Task;
  projectName: string;
  onUpdate?: () => void;
}

export default function TaskActions({ task, projectName, onUpdate }: TaskActionsProps) {
  const { startAgent, stopAgent, loading: agentLoading } = useAgent(projectName);
  const { createWorktree } = useWorktrees(projectName);
  const [showWorktreeForm, setShowWorktreeForm] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [workingAction, setWorkingAction] = useState<'worktree' | 'agent' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasBranch = Boolean(task.git.branch);
  const isAgentRunning = task.agent.status === 'running';

  const statusMeta: Record<string, { label: string; className: string }> = {
    running: { label: '运行中', className: 'border-green-200 bg-green-50 text-green-700' },
    completed: { label: '已完成', className: 'border-blue-200 bg-blue-50 text-blue-700' },
    failed: { label: '失败', className: 'border-red-200 bg-red-50 text-red-700' },
    pending: { label: '待启动', className: 'border-amber-200 bg-amber-50 text-amber-700' },
    none: { label: '未分配', className: 'border-slate-200 bg-slate-100 text-slate-700' }
  };

  const currentStatus = task.agent.status || 'none';

  const handleCreateWorktree = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedBranch = branchName.trim();
    if (!normalizedBranch) return;

    setWorkingAction('worktree');
    setErrorMessage(null);
    try {
      await createWorktree({
        branch: normalizedBranch,
        worktree_path: `/tmp/worktrees/${normalizedBranch}`,
        agent: { identity: 'claude-opus-4', model: 'claude-opus-4-6' }
      });
      setShowWorktreeForm(false);
      setBranchName('');
      onUpdate?.();
    } catch (err: any) {
      setErrorMessage(err?.message || '创建 Worktree 失败');
      console.error('Failed to create worktree:', err);
    } finally {
      setWorkingAction(null);
    }
  };

  const handleStartAgent = async () => {
    setWorkingAction('agent');
    setErrorMessage(null);
    try {
      await startAgent(task.id, task.git.branch || undefined);
      onUpdate?.();
    } catch (err: any) {
      setErrorMessage(err?.message || '启动 Agent 失败');
      console.error('Failed to start agent:', err);
    } finally {
      setWorkingAction(null);
    }
  };

  const handleStopAgent = async () => {
    setWorkingAction('agent');
    setErrorMessage(null);
    try {
      await stopAgent(task.id);
      onUpdate?.();
    } catch (err: any) {
      setErrorMessage(err?.message || '停止 Agent 失败');
      console.error('Failed to stop agent:', err);
    } finally {
      setWorkingAction(null);
    }
  };

  return (
    <section className="space-y-3 border-t border-border pt-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Task Actions</h3>
      <div className="grid gap-3 lg:grid-cols-2">
        <article className="space-y-3 rounded-md border border-border bg-white p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-text">Worktree</h4>
              <p className="mt-1 text-xs text-muted">为任务创建独立分支工作目录</p>
            </div>
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                hasBranch ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}
            >
              {hasBranch ? '已关联分支' : '未创建'}
            </span>
          </div>

          {hasBranch ? (
            <div className="rounded border border-border bg-slate-50 p-2">
              <p className="text-xs text-muted">当前分支</p>
              <p className="mt-1 font-mono text-xs text-slate-700">{task.git.branch}</p>
            </div>
          ) : !showWorktreeForm ? (
            <button
              onClick={() => setShowWorktreeForm(true)}
              className="w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-primary-hover"
            >
              创建 Worktree
            </button>
          ) : (
            <form onSubmit={handleCreateWorktree} className="space-y-2">
              <input
                type="text"
                value={branchName}
                onChange={(event) => setBranchName(event.target.value)}
                placeholder={`feature/${task.id}`}
                className="w-full rounded border border-border bg-white p-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={workingAction === 'worktree' || !branchName.trim()}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {workingAction === 'worktree' ? '创建中...' : '确认创建'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWorktreeForm(false)}
                  className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted transition-colors duration-200 hover:bg-slate-100"
                >
                  取消
                </button>
              </div>
            </form>
          )}
        </article>

        <article className="space-y-3 rounded-md border border-border bg-white p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-text">Agent</h4>
              <p className="mt-1 text-xs text-muted">启动或停止当前任务的执行代理</p>
            </div>
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusMeta[currentStatus]?.className || statusMeta.none.className}`}>
              {statusMeta[currentStatus]?.label || statusMeta.none.label}
            </span>
          </div>

          {task.agent.session_id && (
            <div className="rounded border border-border bg-slate-50 p-2">
              <p className="text-xs text-muted">Session ID</p>
              <p className="mt-1 font-mono text-xs text-slate-700">{task.agent.session_id}</p>
            </div>
          )}

          <div className="flex gap-2">
            {!isAgentRunning ? (
              <button
                onClick={handleStartAgent}
                disabled={agentLoading || workingAction === 'agent'}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {workingAction === 'agent' ? '启动中...' : '启动 Agent'}
              </button>
            ) : (
              <button
                onClick={handleStopAgent}
                disabled={workingAction === 'agent'}
                className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors duration-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {workingAction === 'agent' ? '停止中...' : '停止 Agent'}
              </button>
            )}
          </div>
        </article>
      </div>

      {errorMessage && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      )}
    </section>
  );
}
