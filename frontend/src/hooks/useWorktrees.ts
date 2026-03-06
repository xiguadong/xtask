import { useState, useEffect } from 'react';
import { Worktree } from '../types';

const API_BASE = '/api';

export function useWorktrees(projectName: string) {
  const [worktrees, setWorktrees] = useState<Worktree[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectName}/worktrees`)
      .then(async (res) => (res.ok ? res.json() : []))
      .then((data) => setWorktrees(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
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

  return { worktrees, loading, createWorktree, deleteWorktree };
}
