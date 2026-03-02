import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaskStore } from '../stores/taskStore';

export function useFilterSync() {
  const [params, setParams] = useSearchParams();
  const filters = useTaskStore((state) => state.filters);
  const setFilter = useTaskStore((state) => state.setFilter);

  useEffect(() => {
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
    setParams(next, { replace: true });
  }, [filters, setParams]);
}
