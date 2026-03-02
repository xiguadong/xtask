import { create } from 'zustand';
import { api } from '../lib/api';
import type { ProjectSummary, SummaryStats } from '../lib/types';

interface ProjectStoreState {
  projects: ProjectSummary[];
  summary: SummaryStats;
  loading: boolean;
  error: string;
  statusFilter: '' | 'healthy' | 'at_risk' | 'blocked';
  fetchProjects: () => Promise<void>;
  setStatusFilter: (status: '' | 'healthy' | 'at_risk' | 'blocked') => void;
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: [],
  summary: { total: 0, due_this_week: 0, blocked_total: 0 },
  loading: false,
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
  setStatusFilter: (status) => {
    const curr = get().statusFilter;
    set({ statusFilter: curr === status ? '' : status });
  },
}));
