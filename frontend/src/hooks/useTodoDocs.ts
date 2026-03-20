import { useCallback, useEffect, useState } from 'react';
import { fetchTodoDocs, TodoDocsResponse } from '../utils/api';

export function useTodoDocs(projectName: string, taskId: string, branch?: string) {
  const [docs, setDocs] = useState<TodoDocsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectName || !taskId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTodoDocs(projectName, taskId, branch);
      setDocs(data);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [projectName, taskId, branch]);

  useEffect(() => {
    void load();
  }, [load]);

  return { docs, loading, error, reload: load };
}
