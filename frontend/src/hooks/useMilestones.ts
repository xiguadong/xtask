import { useState, useEffect } from 'react';
import { fetchMilestones } from '../utils/api';
import { Milestone } from '../types';

export function useMilestones(projectName: string) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await fetchMilestones(projectName);
    setMilestones(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [projectName]);

  return { milestones, loading, refresh: load };
}
