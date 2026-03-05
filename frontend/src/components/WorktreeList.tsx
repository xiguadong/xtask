import { useState } from 'react';
import { Worktree } from '../types';
import { WorktreeCard } from './WorktreeCard';

interface WorktreeListProps {
  worktrees: Worktree[];
  onDelete: (branch: string) => void;
  onCreate: (data: any) => void;
}

export function WorktreeList({ worktrees, onDelete, onCreate }: WorktreeListProps) {
  const [showForm, setShowForm] = useState(false);
  const [branch, setBranch] = useState('');
  const [path, setPath] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ branch, worktree_path: path });
    setBranch('');
    setPath('');
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Worktrees</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + 新建
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded">
          <input
            type="text"
            placeholder="分支名"
            value={branch}
            onChange={e => setBranch(e.target.value)}
            className="w-full mb-2 px-3 py-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Worktree 路径"
            value={path}
            onChange={e => setPath(e.target.value)}
            className="w-full mb-2 px-3 py-2 border rounded"
            required
          />
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
            创建
          </button>
        </form>
      )}

      <div className="grid gap-4">
        {worktrees.map(wt => (
          <WorktreeCard key={wt.branch} worktree={wt} onDelete={() => onDelete(wt.branch)} />
        ))}
      </div>
    </div>
  );
}
