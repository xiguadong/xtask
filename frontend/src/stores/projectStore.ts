import { create } from 'zustand';
import { api } from '../lib/api';
import type { ProjectSummary, SummaryStats } from '../lib/types';

interface ProjectStoreState {
  projects: ProjectSummary[];
  summary: SummaryStats;
  loading: boolean;
  deletingProjectId: string;
  error: string;
  statusFilter: '' | 'healthy' | 'at_risk' | 'blocked';
  fetchProjects: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  setStatusFilter: (status: '' | 'healthy' | 'at_risk' | 'blocked') => void;
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: [],
  summary: { total: 0, due_this_week: 0, blocked_total: 0 },
  loading: false,
  deletingProjectId: '',
  error: '',
  statusFilter: '',
  fetchProjects: async () => {
    set({ loading: true, error: '' });
    try {
      const data = await api.listProjects();
      set({ projects: data.projects, summary: data.summary, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  deleteProject: async (projectId: string) => {
    if (!projectId) return;
    set({ deletingProjectId: projectId, error: '' });
    try {
      await api.deleteProject(projectId);
      const data = await api.listProjects();
      set({
        projects: data.projects,
        summary: data.summary,
        deletingProjectId: '',
      });
    } catch (error) {
      set({ error: (error as Error).message, deletingProjectId: '' });
    }
  },
  setStatusFilter: (status) => {
    const curr = get().statusFilter;
    set({ statusFilter: curr === status ? '' : status });
  },
}));
