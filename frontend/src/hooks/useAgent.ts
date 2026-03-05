import { useState } from 'react';

export function useAgent(projectName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAgent = async (taskId: string, branch?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectName}/tasks/${taskId}/agent/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch })
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStatus = async (taskId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectName}/tasks/${taskId}/agent/status`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  const stopAgent = async (taskId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectName}/tasks/${taskId}/agent/stop`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { startAgent, getStatus, stopAgent, loading, error };
}
