import type {
  HistoryEntry,
  MilestoneWithProgress,
  ProjectListResponse,
  Relation,
  Task,
  TaskGraph,
} from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(payload?.error?.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const api = {
  health: () => request<string>('/healthz'),
  listProjects: () => request<ProjectListResponse>('/api/projects'),
  addProject: (path: string) => request('/api/projects', { method: 'POST', body: JSON.stringify({ path }) }),
  deleteProject: (projectId: string) => request(`/api/projects/${projectId}`, { method: 'DELETE' }),
  getProject: (projectId: string) => request<TaskGraph>(`/api/projects/${projectId}`),
  listTasks: (projectId: string, query = '') => request<{ tasks: Task[] }>(`/api/projects/${projectId}/tasks${query ? `?${query}` : ''}`),
  createTask: (projectId: string, input: Partial<Task>) => request<Task>(`/api/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(input) }),
  updateTask: (projectId: string, taskId: string, input: Partial<Task>) =>
    request<Task>(`/api/projects/${projectId}/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteTask: (projectId: string, taskId: string) => request(`/api/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' }),
  listMilestones: (projectId: string) => request<{ milestones: MilestoneWithProgress[] }>(`/api/projects/${projectId}/milestones`),
  createMilestone: (projectId: string, input: { title: string; description?: string; due_date?: string }) =>
    request(`/api/projects/${projectId}/milestones`, { method: 'POST', body: JSON.stringify(input) }),
  updateMilestone: (projectId: string, msId: string, input: Record<string, unknown>) =>
    request(`/api/projects/${projectId}/milestones/${msId}`, { method: 'PUT', body: JSON.stringify(input) }),
  createRelation: (projectId: string, input: Pick<Relation, 'type' | 'source_id' | 'target_id'>) =>
    request<Relation>(`/api/projects/${projectId}/relations`, { method: 'POST', body: JSON.stringify(input) }),
  deleteRelation: (projectId: string, relId: string) => request(`/api/projects/${projectId}/relations/${relId}`, { method: 'DELETE' }),
  listHistory: (projectId: string, taskId?: string) =>
    request<{ history: HistoryEntry[] }>(`/api/projects/${projectId}/history${taskId ? `?task_id=${taskId}` : ''}`),
};
