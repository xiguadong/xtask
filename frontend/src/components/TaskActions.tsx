import { useMemo, useState } from 'react';
import { useWorktrees } from '../hooks/useWorktrees';
import { Task, Worktree } from '../types';
import { deleteTask, updateTask } from '../utils/api';
import { formatTaskWorktreeBranchName } from '../utils/taskDisplay';

interface TaskActionSharedProps {
  task: Task;
  projectName: string;
  onUpdate?: () => void;
}

interface TaskDeletePanelProps extends TaskActionSharedProps {
  onDeleted?: () => void | Promise<void>;
}

export function TaskWorktreePanel({ task, projectName, onUpdate }: TaskActionSharedProps) {
  const { worktrees, createWorktree, defaultBranch } = useWorktrees(projectName);
  const [showWorktreeForm, setShowWorktreeForm] = useState(false);
  const [worktreeMode, setWorktreeMode] = useState<'create' | 'link'>('create');
  const [sourceBranch, setSourceBranch] = useState(task.git.source_branch || '');
  const [branchName, setBranchName] = useState('');
  const [worktreePath, setWorktreePath] = useState('');
  const [selectedExistingBranch, setSelectedExistingBranch] = useState('');
  const [workingAction, setWorkingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasBranch = Boolean(task.git.branch);
  const currentWorktree = useMemo(
    () => (task.git.branch ? worktrees.find((wt) => wt.branch === task.git.branch) : null),
    [task.git.branch, worktrees]
  );
  const availableWorktrees = useMemo(
    () => worktrees.filter((wt) => wt.branch !== task.git.branch),
    [task.git.branch, worktrees]
  );
  const selectedExistingWorktree = useMemo(
    () => availableWorktrees.find((wt) => wt.branch === selectedExistingBranch) || null,
    [availableWorktrees, selectedExistingBranch]
  );
  const detectedSourceBranch = currentWorktree?.source_branch || task.git.source_branch || defaultBranch || 'main';

  const resetWorktreeDraft = (mode: 'create' | 'link' = 'create') => {
    setWorktreeMode(mode);
    setSourceBranch(task.git.source_branch || defaultBranch || '');
    const defaultWorktreeBranch = formatTaskWorktreeBranchName(task);
    setBranchName(defaultWorktreeBranch);
    setWorktreePath(`cache/worktrees/${defaultWorktreeBranch}`);
    setSelectedExistingBranch(availableWorktrees[0]?.branch || '');
  };

  const saveTaskGitConfig = async (worktree: Worktree) => {
    await updateTask(projectName, task.id, {
      git: {
        branch: worktree.branch,
        source_branch: worktree.source_branch || task.git.source_branch || defaultBranch || null
      }
    });
  };

  const handleCreateWorktree = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedSourceBranch = sourceBranch.trim();
    const normalizedBranch = branchName.trim();
    const normalizedPath = worktreePath.trim();
    if (!normalizedBranch || !normalizedPath) return;

    setWorkingAction(true);
    setErrorMessage(null);
    try {
      const createdWorktree = await createWorktree({
        branch: normalizedBranch,
        worktree_path: normalizedPath,
        source_branch: normalizedSourceBranch || undefined
      });
      await saveTaskGitConfig(createdWorktree);
      setShowWorktreeForm(false);
      setSourceBranch(createdWorktree.source_branch || normalizedSourceBranch || detectedSourceBranch);
      setBranchName('');
      setWorktreePath('');
      setSelectedExistingBranch('');
      onUpdate?.();
    } catch (err: any) {
      setErrorMessage(err?.message || '创建 Worktree 失败');
      console.error('Failed to create worktree:', err);
    } finally {
      setWorkingAction(false);
    }
  };

  const handleLinkWorktree = async () => {
    if (!selectedExistingWorktree) return;

    setWorkingAction(true);
    setErrorMessage(null);
    try {
      await saveTaskGitConfig(selectedExistingWorktree);
      setShowWorktreeForm(false);
      setSelectedExistingBranch('');
      onUpdate?.();
    } catch (err: any) {
      setErrorMessage(err?.message || '关联已有 Worktree 失败');
      console.error('Failed to link worktree:', err);
    } finally {
      setWorkingAction(false);
    }
  };

  return (
    <section className="space-y-3 rounded-lg border border-border bg-surface p-3">
      <div className="border-b border-border pb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Worktree</h3>
      </div>

      <article className="space-y-3 rounded-md border border-border bg-white p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-text">分支工作区</h4>
            <p className="mt-1 text-xs text-muted">为任务创建独立 worktree，或关联已有工作目录。</p>
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
            <p className="mt-1 break-all font-mono text-xs text-slate-700">{task.git.branch}</p>
            <p className="mt-2 text-xs text-muted">从哪个分支创建</p>
            <p className="mt-1 break-all font-mono text-xs text-slate-700">
              {currentWorktree?.source_branch || task.git.source_branch || detectedSourceBranch}
            </p>
            <p className="mt-2 text-xs text-muted">工作目录</p>
            <p className="mt-1 break-all font-mono text-xs text-slate-700">
              {currentWorktree?.worktree_path || '未找到 worktree 记录'}
            </p>
          </div>
        ) : !showWorktreeForm ? (
          <button
            onClick={() => {
              setShowWorktreeForm(true);
              resetWorktreeDraft('create');
            }}
            className="w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-primary-hover"
          >
            配置 Worktree
          </button>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => resetWorktreeDraft('create')}
                className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors duration-200 ${
                  worktreeMode === 'create'
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-border bg-white text-muted hover:bg-slate-100'
                }`}
              >
                新建 Worktree
              </button>
              <button
                type="button"
                onClick={() => resetWorktreeDraft('link')}
                disabled={availableWorktrees.length === 0}
                className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                  worktreeMode === 'link'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-border bg-white text-muted hover:bg-slate-100'
                }`}
              >
                关联已有 Worktree
              </button>
            </div>

            {worktreeMode === 'create' ? (
              <form onSubmit={handleCreateWorktree} className="space-y-2">
                <label className="space-y-1 text-xs text-muted">
                  从哪个分支创建
                  <input
                    type="text"
                    value={sourceBranch}
                    onChange={(event) => setSourceBranch(event.target.value)}
                    placeholder={`默认: ${detectedSourceBranch}`}
                    className="w-full rounded border border-border bg-white p-2 text-sm text-text"
                  />
                </label>
                <p className="text-[11px] text-muted">当前项目默认分支：{detectedSourceBranch}</p>
                <label className="space-y-1 text-xs text-muted">
                  Worktree 分支
                  <input
                    type="text"
                    value={branchName}
                    onChange={(event) => setBranchName(event.target.value)}
                    placeholder={`默认: ${formatTaskWorktreeBranchName(task)}`}
                    className="w-full rounded border border-border bg-white p-2 text-sm text-text"
                  />
                </label>
                <label className="space-y-1 text-xs text-muted">
                  Worktree 路径
                  <input
                    type="text"
                    value={worktreePath}
                    onChange={(event) => setWorktreePath(event.target.value)}
                    placeholder={`默认: cache/worktrees/${formatTaskWorktreeBranchName(task)}`}
                    className="w-full rounded border border-border bg-white p-2 text-sm text-text"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={workingAction || !branchName.trim() || !worktreePath.trim()}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {workingAction ? '创建中...' : '确认创建'}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetWorktreeDraft('create')}
                    disabled={workingAction}
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
                      setSelectedExistingBranch('');
                    }}
                    className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted transition-colors duration-200 hover:bg-slate-100"
                  >
                    取消
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                {availableWorktrees.length > 0 ? (
                  <>
                    <label className="space-y-1 text-xs text-muted">
                      选择已有 Worktree
                      <select
                        value={selectedExistingBranch}
                        onChange={(event) => setSelectedExistingBranch(event.target.value)}
                        className="w-full rounded border border-border bg-white p-2 text-sm text-text"
                      >
                        {availableWorktrees.map((worktree) => (
                          <option key={worktree.branch} value={worktree.branch}>
                            {worktree.branch}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="rounded border border-border bg-slate-50 p-2">
                      <p className="text-xs text-muted">来源分支</p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-700">
                        {selectedExistingWorktree?.source_branch || detectedSourceBranch}
                      </p>
                      <p className="mt-2 text-xs text-muted">工作目录</p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-700">
                        {selectedExistingWorktree?.worktree_path || '未找到 worktree 路径'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleLinkWorktree}
                        disabled={workingAction || !selectedExistingBranch}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {workingAction ? '关联中...' : '确认关联'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowWorktreeForm(false);
                          setSelectedExistingBranch('');
                        }}
                        className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted transition-colors duration-200 hover:bg-slate-100"
                      >
                        取消
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="rounded border border-border bg-slate-50 px-3 py-2 text-xs text-muted">
                    当前项目还没有可关联的已有 Worktree，请先创建一个新的。
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </article>

      {errorMessage && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{errorMessage}</div>
      )}
    </section>
  );
}

export function TaskDeletePanel({ task, projectName, onDeleted }: TaskDeletePanelProps) {
  const [workingAction, setWorkingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDeleteTask = async () => {
    const confirmed = window.confirm(`确认删除任务「${task.title}」吗？该操作会同时清理关联的分支任务记录。`);
    if (!confirmed) return;

    setWorkingAction(true);
    setErrorMessage(null);
    try {
      await deleteTask(projectName, task.id);
      await onDeleted?.();
    } catch (err: any) {
      setErrorMessage(err?.message || '删除任务失败');
      console.error('Failed to delete task:', err);
    } finally {
      setWorkingAction(false);
    }
  };

  return (
    <section className="space-y-3 rounded-lg border border-red-200 bg-red-50/60 p-3">
      <div className="border-b border-red-200 pb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-red-700">危险操作</h3>
      </div>

      <article className="space-y-3 rounded-md border border-red-200 bg-white p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-red-800">删除任务</h4>
            <p className="mt-1 text-xs text-red-700">删除当前任务，并同步清理关联的分支任务记录与 worktree 任务引用。</p>
          </div>
          <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
            高风险
          </span>
        </div>

        <button
          type="button"
          onClick={handleDeleteTask}
          disabled={workingAction}
          className="w-full rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {workingAction ? '删除中...' : '确认删除任务'}
        </button>

        {errorMessage && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{errorMessage}</div>}
      </article>
    </section>
  );
}
