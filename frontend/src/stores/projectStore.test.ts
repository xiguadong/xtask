import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
import { useProjectStore } from './projectStore';

vi.mock('../lib/api', () => ({
  api: {
    listProjects: vi.fn(),
    deleteProject: vi.fn(),
  },
}));

function resetStore() {
  useProjectStore.setState({
    projects: [],
    summary: { total: 0, due_this_week: 0, blocked_total: 0 },
    loading: false,
    deletingProjectId: '',
    error: '',
    statusFilter: '',
  });
}

describe('projectStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetStore();
  });

  it('toggles status filter', () => {
    useProjectStore.getState().setStatusFilter('healthy');
    expect(useProjectStore.getState().statusFilter).toBe('healthy');

    useProjectStore.getState().setStatusFilter('healthy');
    expect(useProjectStore.getState().statusFilter).toBe('');
  });

  it('loads project list successfully', async () => {
    vi.mocked(api.listProjects).mockResolvedValue({
      projects: [
        {
          id: 'proj-1',
          name: 'demo',
          status: 'healthy',
          active_milestone: 'M1',
          progress: 50,
          blocked_count: 1,
          due_soon: false,
        },
      ],
      summary: { total: 1, due_this_week: 0, blocked_total: 1 },
    });

    await useProjectStore.getState().fetchProjects();

    expect(api.listProjects).toHaveBeenCalledTimes(1);
    expect(useProjectStore.getState().loading).toBe(false);
    expect(useProjectStore.getState().error).toBe('');
    expect(useProjectStore.getState().projects).toHaveLength(1);
    expect(useProjectStore.getState().summary.total).toBe(1);
  });

  it('captures api error when loading fails', async () => {
    vi.mocked(api.listProjects).mockRejectedValue(new Error('network fail'));

    await useProjectStore.getState().fetchProjects();

    expect(useProjectStore.getState().loading).toBe(false);
    expect(useProjectStore.getState().error).toBe('network fail');
  });

  it('deletes project and refreshes list', async () => {
    vi.mocked(api.deleteProject).mockResolvedValue({ status: 'deleted' } as never);
    vi.mocked(api.listProjects).mockResolvedValue({
      projects: [],
      summary: { total: 0, due_this_week: 0, blocked_total: 0 },
    });

    await useProjectStore.getState().deleteProject('proj-1');

    expect(api.deleteProject).toHaveBeenCalledWith('proj-1');
    expect(api.listProjects).toHaveBeenCalledTimes(1);
    expect(useProjectStore.getState().deletingProjectId).toBe('');
    expect(useProjectStore.getState().projects).toHaveLength(0);
  });

  it('captures api error when deleting project fails', async () => {
    vi.mocked(api.deleteProject).mockRejectedValue(new Error('delete failed'));

    await useProjectStore.getState().deleteProject('proj-1');

    expect(useProjectStore.getState().deletingProjectId).toBe('');
    expect(useProjectStore.getState().error).toBe('delete failed');
  });
});
