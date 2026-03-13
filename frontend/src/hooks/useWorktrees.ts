import { useEffect, useState } from 'react';
import { Project, Worktree } from '../types';
import { fetchProject } from '../utils/api';

export function useWorktrees(projectName: string) {
  const [worktrees, setWorktrees] = useState<Worktree[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultBranch, setDefaultBranch] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [worktreeRes, project] = await Promise.all([
        fetch(`/api/projects/${projectName}/worktrees`),
        fetchProject(projectName).catch(() => null)
      ]);
      const worktreeData = await worktreeRes.json().catch(() => []);
      setWorktrees(Array.isArray(worktreeData) ? worktreeData : []);
      setDefaultBranch((project as Project | null)?.default_branch ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [projectName]);

  const createWorktree = async (data: { branch: string; worktree_path: string; source_branch?: string; agent?: any }) => {
    const res = await fetch(`/api/projects/${projectName}/worktrees`, {
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
    const res = await fetch(`/api/projects/${projectName}/worktrees/${branch}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      throw new Error(payload?.error || '删除 worktree 失败');
    }
    setWorktrees((prev) => prev.filter((w) => w.branch !== branch));
  };

  return { worktrees, loading, defaultBranch, refresh: load, createWorktree, deleteWorktree };
}
