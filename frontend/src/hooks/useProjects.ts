import { useState, useEffect } from 'react';
import { fetchProjects } from '../utils/api';
import { Project } from '../types';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await fetchProjects();
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return { projects, loading, refresh: load };
}
