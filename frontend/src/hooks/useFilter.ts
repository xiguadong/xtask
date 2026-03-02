import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaskStore } from '../stores/taskStore';
import type { ProjectViewMode } from '../lib/types';

const VIEW_MODES: ProjectViewMode[] = ['board', 'list', 'plan', 'feature'];

export function useFilterSync() {
  const [params, setParams] = useSearchParams();
  const filters = useTaskStore((state) => state.filters);
  const viewMode = useTaskStore((state) => state.viewMode);
  const setFilter = useTaskStore((state) => state.setFilter);
  const setViewMode = useTaskStore((state) => state.setViewMode);

  useEffect(() => {
    const view = params.get('view');
    if (view && VIEW_MODES.includes(view as ProjectViewMode)) {
      setViewMode(view as ProjectViewMode);
    }

    const fromURL = {
      status: params.get('status') || undefined,
      priority: params.get('priority') || undefined,
      milestone: params.get('milestone') || undefined,
      labels: params.get('labels') || undefined,
      due_before: params.get('due_before') || undefined,
      due_after: params.get('due_after') || undefined,
      is_blocked: params.get('is_blocked') || undefined,
      q: params.get('q') || undefined,
    };
    setFilter(fromURL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        next.set(key, value);
      }
    });
    if (viewMode !== 'board') {
      next.set('view', viewMode);
    }
    setParams(next, { replace: true });
  }, [filters, setParams, viewMode]);
}
