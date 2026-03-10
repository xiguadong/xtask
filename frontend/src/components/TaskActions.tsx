import { useMemo, useState } from 'react';
import { useWorktrees } from '../hooks/useWorktrees';
import { Task } from '../types';
import { deleteTask } from '../utils/api';
import TaskTerminalPanel from './TaskTerminalPanel';

interface TaskActionsProps {
  task: Task;
  projectName: string;
  onUpdate?: () => void;
  onDeleted?: () => void | Promise<void>;
}

export default function TaskActions({ task, projectName, onUpdate, onDeleted }: TaskActionsProps) {
  const { worktrees, createWorktree } = useWorktrees(projectName);
  const [showWorktreeForm, setShowWorktreeForm] = useState(false);
  const [sourceBranch, setSourceBranch] = useState(task.git.source_branch || '');
  const [branchName, setBranchName] = useState('');
  const [worktreePath, setWorktreePath] = useState('');
  const [workingAction, setWorkingAction] = useState<'worktree' | 'delete' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasBranch = Boolean(task.git.branch);
  const currentWorktree = useMemo(
    () => (task.git.branch ? worktrees.find((wt) => wt.branch === task.git.branch) : null),
    [task.git.branch, worktrees]
  );

  const handleCreateWorktree = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedSourceBranch = sourceBranch.trim();
    const normalizedBranch = branchName.trim();
    const normalizedPath = worktreePath.trim();
    if (!normalizedBranch || !normalizedPath) return;

    setWorkingAction('worktree');
    setErrorMessage(null);
    try {
      await createWorktree({
        branch: normalizedBranch,
        worktree_path: normalizedPath,
        source_branch: normalizedSourceBranch || undefined
      });
      const res = await fetch(`/api/projects/${projectName}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ git: { branch: normalizedBranch, source_branch: normalizedSourceBranch || null } })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || '关联任务分支失败');
      }
      setShowWorktreeForm(false);
      setSourceBranch(normalizedSourceBranch);
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

  const handleDeleteTask = async () => {
    const confirmed = window.confirm(`确认删除任务「${task.title}」吗？该操作会同时清理关联的分支任务记录。`);
    if (!confirmed) return;

    setWorkingAction('delete');
    setErrorMessage(null);
    try {
      await deleteTask(projectName, task.id);
      await onDeleted?.();
    } catch (err: any) {
      setErrorMessage(err?.message || '删除任务失败');
      console.error('Failed to delete task:', err);
    } finally {
      setWorkingAction(null);
    }
  };

  return (
    <section className="space-y-3 border-t border-border pt-3">
      <div className="border-b border-border pb-3">
        <h3 className="text-sm font-semibold text-text">任务操作</h3>
        <p className="mt-1 text-xs text-muted">操作区与任务描述、任务总结使用同一套标题与正文规则。</p>
      </div>
      <div className="grid gap-3">
        <article className="space-y-3 rounded-md border border-border bg-white p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-text">Worktree</h4>
              <p className="mt-1 text-xs text-muted">为任务创建独立分支工作目录。</p>
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
              <p className="mt-2 text-xs text-muted">从哪个分支创建</p>
              <p className="mt-1 font-mono text-xs text-slate-700">{task.git.source_branch || '自动检测'}</p>
              <p className="mt-2 text-xs text-muted">工作目录</p>
              <p className="mt-1 font-mono text-xs text-slate-700">{currentWorktree?.worktree_path || '未找到 worktree 记录'}</p>
            </div>
          ) : !showWorktreeForm ? (
            <button
              onClick={() => {
                setShowWorktreeForm(true);
                setSourceBranch(task.git.source_branch || '');
                setBranchName(task.id);
                setWorktreePath(`cache/worktrees/${task.id}`);
              }}
              className="w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-primary-hover"
            >
              配置 Worktree
            </button>
          ) : (
            <form onSubmit={handleCreateWorktree} className="space-y-2">
              <label className="space-y-1 text-xs text-muted">
                从哪个分支创建
                <input
                  type="text"
                  value={sourceBranch}
                  onChange={(event) => setSourceBranch(event.target.value)}
                  placeholder="留空自动检测（推荐，例如 main）"
                  className="w-full rounded border border-border bg-white p-2 text-sm text-text"
                />
              </label>
              <label className="space-y-1 text-xs text-muted">
                Worktree 分支
                <input
                  type="text"
                  value={branchName}
                  onChange={(event) => setBranchName(event.target.value)}
                  placeholder={`默认: ${task.id}`}
                  className="w-full rounded border border-border bg-white p-2 text-sm text-text"
                />
              </label>
              <label className="space-y-1 text-xs text-muted">
                Worktree 路径
                <input
                  type="text"
                  value={worktreePath}
                  onChange={(event) => setWorktreePath(event.target.value)}
                  placeholder={`默认: cache/worktrees/${task.id}`}
                  className="w-full rounded border border-border bg-white p-2 text-sm text-text"
                />
              </label>
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
                    setSourceBranch(task.git.source_branch || '');
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
                    setSourceBranch('');
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

        <article className="space-y-3 rounded-md border border-red-200 bg-red-50/60 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-red-800">删除任务</h4>
              <p className="mt-1 text-xs text-red-700">删除当前任务，并同步清理关联的分支任务记录与 worktree 任务引用。</p>
            </div>
            <span className="rounded-full border border-red-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-red-700">
              高风险
            </span>
          </div>

          <button
            type="button"
            onClick={handleDeleteTask}
            disabled={workingAction !== null}
            className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {workingAction === 'delete' ? '删除中...' : '确认删除任务'}
          </button>
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
