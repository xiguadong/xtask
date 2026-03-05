import { useState, useEffect } from 'react';
import { fetchTasks } from '../utils/api';
import { Task } from '../types';

export function useTasks(projectName: string, filters?: Record<string, string>) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await fetchTasks(projectName, filters);
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [projectName, JSON.stringify(filters)]);

  return { tasks, loading, refresh: load };
}
