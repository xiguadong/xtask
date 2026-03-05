import { useMemo, useState } from 'react';
import { useWorktrees } from '../hooks/useWorktrees';
import { Task } from '../types';
import TaskTerminalPanel from './TaskTerminalPanel';

interface TaskActionsProps {
  task: Task;
  projectName: string;
  onUpdate?: () => void;
}

export default function TaskActions({ task, projectName, onUpdate }: TaskActionsProps) {
  const { worktrees, createWorktree } = useWorktrees(projectName);
  const [showWorktreeForm, setShowWorktreeForm] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [worktreePath, setWorktreePath] = useState('');
  const [workingAction, setWorkingAction] = useState<'worktree' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasBranch = Boolean(task.git.branch);
  const currentWorktree = useMemo(
    () => (task.git.branch ? worktrees.find((wt) => wt.branch === task.git.branch) : null),
    [task.git.branch, worktrees]
  );

  const handleCreateWorktree = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedBranch = branchName.trim();
    const normalizedPath = worktreePath.trim();
    if (!normalizedBranch || !normalizedPath) return;

    setWorkingAction('worktree');
    setErrorMessage(null);
    try {
      await createWorktree({
        branch: normalizedBranch,
        worktree_path: normalizedPath
      });
      const res = await fetch(`/api/projects/${projectName}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ git: { branch: normalizedBranch } })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || '关联任务分支失败');
      }
      setShowWorktreeForm(false);
      setBranchName('');
      setWorktreePath('');
      onUpdate?.();
    } catch (err: any) {
      setErrorMessage(err?.message || '创建 Worktree 失败');
      console.error('Failed to create worktree:', err);
    } finally {
      setWorkingAction(null);
    }
  };

  return (
    <section className="space-y-3 border-t border-border pt-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Task Actions</h3>
      <div className="grid gap-3">
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
              <p className="mt-2 text-xs text-muted">工作目录</p>
              <p className="mt-1 font-mono text-xs text-slate-700">{currentWorktree?.worktree_path || '未找到 worktree 记录'}</p>
            </div>
          ) : !showWorktreeForm ? (
            <button
              onClick={() => {
                setShowWorktreeForm(true);
                setBranchName(task.id);
                setWorktreePath(`cache/worktrees/${task.id}`);
              }}
              className="w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-primary-hover"
            >
              配置 Worktree
            </button>
          ) : (
            <form onSubmit={handleCreateWorktree} className="space-y-2">
              <input
                type="text"
                value={branchName}
                onChange={(event) => setBranchName(event.target.value)}
                placeholder={`默认: ${task.id}`}
                className="w-full rounded border border-border bg-white p-2 text-sm"
              />
              <input
                type="text"
                value={worktreePath}
                onChange={(event) => setWorktreePath(event.target.value)}
                placeholder={`默认: cache/worktrees/${task.id}`}
                className="w-full rounded border border-border bg-white p-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={workingAction === 'worktree' || !branchName.trim() || !worktreePath.trim()}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {workingAction === 'worktree' ? '创建中...' : '确认创建'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBranchName(task.id);
                    setWorktreePath(`cache/worktrees/${task.id}`);
                  }}
                  disabled={workingAction === 'worktree'}
                  className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted transition-colors duration-200 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  使用默认
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowWorktreeForm(false);
                    setBranchName('');
                    setWorktreePath('');
                  }}
                  className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted transition-colors duration-200 hover:bg-slate-100"
                >
                  取消
                </button>
              </div>
            </form>
          )}
        </article>
      </div>

      {errorMessage && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      <TaskTerminalPanel task={task} projectName={projectName} onTaskRefresh={onUpdate} />
    </section>
  );
}
