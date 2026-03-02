import { create } from 'zustand';
import { api } from '../lib/api';
import type { HistoryEntry, MilestoneWithProgress, ProjectViewMode, Relation, Task, TaskGraph, TaskStatus } from '../lib/types';

interface TaskFilter {
  status?: string;
  priority?: string;
  milestone?: string;
  labels?: string;
  due_before?: string;
  due_after?: string;
  is_blocked?: string;
  q?: string;
}

interface TaskStoreState {
  projectId: string;
  graph: TaskGraph | null;
  tasks: Task[];
  milestones: MilestoneWithProgress[];
  relations: Relation[];
  history: HistoryEntry[];
  selectedTaskId: string;
  loading: boolean;
  saving: boolean;
  error: string;
  viewMode: ProjectViewMode;
  filters: TaskFilter;
  setProject: (projectId: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshMilestones: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  createTask: (input: Partial<Task>) => Promise<Task | undefined>;
  updateTask: (taskId: string, input: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  createRelation: (input: Pick<Relation, 'type' | 'source_id' | 'target_id'>) => Promise<void>;
  deleteRelation: (relationId: string) => Promise<void>;
  setSelectedTaskId: (taskId: string) => void;
  setViewMode: (mode: ProjectViewMode) => void;
  setFilter: (patch: Partial<TaskFilter>) => void;
  clearFilters: () => void;
  moveTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
}

function buildQuery(filters: TaskFilter): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) {
      params.set(k, String(v));
    }
  });
  return params.toString();
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  projectId: '',
  graph: null,
  tasks: [],
  milestones: [],
  relations: [],
  history: [],
  selectedTaskId: '',
  loading: false,
  saving: false,
  error: '',
  viewMode: 'board',
  filters: {},
  setProject: async (projectId) => {
    if (!projectId) {
      return;
    }
    set({ loading: true, error: '', projectId, selectedTaskId: '' });
    try {
      const graph = await api.getProject(projectId);
      const [tasks, milestones, history] = await Promise.all([
        api.listTasks(projectId, buildQuery(get().filters)),
        api.listMilestones(projectId),
        api.listHistory(projectId),
      ]);
      set({
        graph,
        tasks: tasks.tasks,
        milestones: milestones.milestones,
        relations: graph.relations,
        history: history.history,
        loading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  refreshTasks: async () => {
    const { projectId, filters } = get();
    if (!projectId) return;
    try {
      const tasks = await api.listTasks(projectId, buildQuery(filters));
      set({ tasks: tasks.tasks });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  refreshMilestones: async () => {
    const { projectId } = get();
    if (!projectId) return;
    try {
      const milestones = await api.listMilestones(projectId);
      set({ milestones: milestones.milestones });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  refreshHistory: async () => {
    const { projectId, selectedTaskId } = get();
    if (!projectId) return;
    try {
      const history = await api.listHistory(projectId, selectedTaskId || undefined);
      set({ history: history.history });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  createTask: async (input) => {
    const { projectId } = get();
    if (!projectId) return undefined;
    set({ saving: true, error: '' });
    try {
      const created = await api.createTask(projectId, input);
      await Promise.all([get().refreshTasks(), get().refreshMilestones()]);
      set({ saving: false });
      return created;
    } catch (error) {
      set({ error: (error as Error).message, saving: false });
      return undefined;
    }
  },
  updateTask: async (taskId, input) => {
    const { projectId, tasks } = get();
    if (!projectId) return;
    const prev = tasks;
    set({
      saving: true,
      tasks: tasks.map((task) => (task.id === taskId ? { ...task, ...input } : task)),
    });
    try {
      await api.updateTask(projectId, taskId, input);
      await Promise.all([get().refreshTasks(), get().refreshMilestones(), get().refreshHistory()]);
      set({ saving: false });
    } catch (error) {
      set({ error: (error as Error).message, tasks: prev, saving: false });
    }
  },
  deleteTask: async (taskId) => {
    const { projectId } = get();
    if (!projectId) return;
    set({ saving: true, error: '' });
    try {
      await api.deleteTask(projectId, taskId);
      await Promise.all([get().refreshTasks(), get().refreshMilestones()]);
      set((state) => ({ saving: false, selectedTaskId: state.selectedTaskId === taskId ? '' : state.selectedTaskId }));
    } catch (error) {
      set({ error: (error as Error).message, saving: false });
    }
  },
  createRelation: async (input) => {
    const { projectId } = get();
    if (!projectId) return;
    set({ saving: true, error: '' });
    try {
      await api.createRelation(projectId, input);
      await Promise.all([get().setProject(projectId), get().refreshHistory()]);
      set({ saving: false });
    } catch (error) {
      set({ error: (error as Error).message, saving: false });
    }
  },
  deleteRelation: async (relationId) => {
    const { projectId } = get();
    if (!projectId) return;
    set({ saving: true, error: '' });
    try {
      await api.deleteRelation(projectId, relationId);
      await Promise.all([get().setProject(projectId), get().refreshHistory()]);
      set({ saving: false });
    } catch (error) {
      set({ error: (error as Error).message, saving: false });
    }
  },
  setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setFilter: (patch) => {
    const next = { ...get().filters, ...patch };
    set({ filters: next });
    void get().refreshTasks();
  },
  clearFilters: () => {
    set({ filters: {} });
    void get().refreshTasks();
  },
  moveTaskStatus: async (taskId, status) => {
    await get().updateTask(taskId, { status });
  },
}));
