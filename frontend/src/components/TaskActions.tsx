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
  const { createWorktree, loading: worktreeLoading } = useWorktrees(projectName);
  const [showWorktreeForm, setShowWorktreeForm] = useState(false);
  const [branchName, setBranchName] = useState('');

  const handleCreateWorktree = async () => {
    if (!branchName) return;
    try {
      await createWorktree({
        branch: branchName,
        worktree_path: `/tmp/worktrees/${branchName}`,
        agent: { identity: 'claude-opus-4', model: 'claude-opus-4-6' }
      });
      setShowWorktreeForm(false);
      setBranchName('');
      onUpdate?.();
    } catch (err) {
      console.error('Failed to create worktree:', err);
    }
  };

  const handleStartAgent = async () => {
    try {
      await startAgent(task.id, task.git.branch || undefined);
      onUpdate?.();
    } catch (err) {
      console.error('Failed to start agent:', err);
    }
  };

  const handleStopAgent = async () => {
    try {
      await stopAgent(task.id);
      onUpdate?.();
    } catch (err) {
      console.error('Failed to stop agent:', err);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 border-t border-border">
      {!task.git.branch && (
        <div>
          {!showWorktreeForm ? (
            <button
              onClick={() => setShowWorktreeForm(true)}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              创建 Worktree
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="分支名称"
                className="flex-1 px-3 py-2 border border-border rounded-md"
              />
              <button
                onClick={handleCreateWorktree}
                disabled={worktreeLoading || !branchName}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                创建
              </button>
              <button
                onClick={() => setShowWorktreeForm(false)}
                className="px-4 py-2 border border-border rounded-md hover:bg-slate-50"
              >
                取消
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {task.agent.status !== 'running' ? (
          <button
            onClick={handleStartAgent}
            disabled={agentLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            🤖 启动 Claude Agent
          </button>
        ) : (
          <button
            onClick={handleStopAgent}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            停止 Agent
          </button>
        )}
      </div>

      {task.agent.status === 'running' && (
        <div className="text-sm text-slate-600">
          Agent 正在运行中...
        </div>
      )}
    </div>
  );
}
