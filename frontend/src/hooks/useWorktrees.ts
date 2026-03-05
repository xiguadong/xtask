import { useState, useEffect } from 'react';
import { Worktree } from '../types';

const API_BASE = '/api';

export function useWorktrees(projectName: string) {
  const [worktrees, setWorktrees] = useState<Worktree[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectName}/worktrees`)
      .then(res => res.json())
      .then(data => setWorktrees(data))
      .finally(() => setLoading(false));
  }, [projectName]);

  const createWorktree = async (data: { branch: string; worktree_path: string; agent?: any }) => {
    const res = await fetch(`${API_BASE}/projects/${projectName}/worktrees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const newWorktree = await res.json();
    setWorktrees([...worktrees, newWorktree]);
    return newWorktree;
  };

  const deleteWorktree = async (branch: string) => {
    await fetch(`${API_BASE}/projects/${projectName}/worktrees/${branch}`, {
      method: 'DELETE'
    });
    setWorktrees(worktrees.filter(w => w.branch !== branch));
  };

  return { worktrees, loading, createWorktree, deleteWorktree };
}
