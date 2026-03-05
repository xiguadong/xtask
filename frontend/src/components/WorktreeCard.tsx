import { Worktree } from '../types';

interface WorktreeCardProps {
  worktree: Worktree;
  onDelete: () => void;
}

export function WorktreeCard({ worktree, onDelete }: WorktreeCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">🌿 {worktree.branch}</h3>
          <p className="text-sm text-gray-600">{worktree.worktree_path}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${
          worktree.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
        }`}>
          {worktree.status}
        </span>
      </div>
      <div className="mt-3 text-sm">
        <p>代理: {worktree.agent.identity || 'None'}</p>
        <p>任务数: {worktree.tasks.length}</p>
      </div>
      <button
        onClick={onDelete}
        className="mt-3 text-red-600 text-sm hover:underline"
      >
        删除
      </button>
    </div>
  );
}
