import { useEffect, useState } from 'react';
import { Worktree } from '../types';

const API_BASE = '/api';

export function useWorktrees(projectName: string) {
  const [worktrees, setWorktrees] = useState<Worktree[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/projects/${projectName}/worktrees`);
    const data = await res.json().catch(() => []);
    setWorktrees(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [projectName]);

  const createWorktree = async (data: { branch: string; worktree_path: string; source_branch?: string; agent?: any }) => {
    const res = await fetch(`${API_BASE}/projects/${projectName}/worktrees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      throw new Error(payload?.error || '创建 worktree 失败');
    }
    const newWorktree = await res.json();
    setWorktrees((prev) => [...prev, newWorktree]);
    return newWorktree;
  };

  const deleteWorktree = async (branch: string) => {
    const res = await fetch(`${API_BASE}/projects/${projectName}/worktrees/${branch}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      throw new Error(payload?.error || '删除 worktree 失败');
    }
    setWorktrees((prev) => prev.filter((w) => w.branch !== branch));
  };

  return { worktrees, loading, refresh: load, createWorktree, deleteWorktree };
}
