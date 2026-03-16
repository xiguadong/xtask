import { useEffect, useState } from 'react';
import { Discussion } from '../types';
import { fetchDiscussions } from '../utils/api';

export function useDiscussions(projectName: string) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await fetchDiscussions(projectName);
    setDiscussions(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [projectName]);

  return { discussions, loading, refresh: load };
}
