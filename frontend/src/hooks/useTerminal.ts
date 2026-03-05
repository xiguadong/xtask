import { useCallback, useState } from 'react';
import {
  fetchTerminalConfig,
  fetchTaskTerminalOutput,
  fetchTaskTerminalStatus,
  fetchTerminalOverview,
  resizeTaskTerminal,
  sendTaskTerminalInput,
  startTaskTerminal,
  stopTaskTerminal,
  updateTerminalConfig,
  updateTaskTerminalConfig
} from '../utils/api';

export function useTerminal(projectName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withLoading = useCallback(async <T,>(action: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      return await action();
    } catch (err: any) {
      setError(err?.message || '终端请求失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const start = useCallback((taskId: string, payload: any) => withLoading(() => startTaskTerminal(projectName, taskId, payload)), [projectName, withLoading]);
  const stop = useCallback((taskId: string, reason?: string) => withLoading(() => stopTaskTerminal(projectName, taskId, reason)), [projectName, withLoading]);
  const sendInput = useCallback((taskId: string, input: string) => sendTaskTerminalInput(projectName, taskId, input), [projectName]);
  const resize = useCallback((taskId: string, cols: number, rows: number) => resizeTaskTerminal(projectName, taskId, cols, rows), [projectName]);
  const updateConfig = useCallback((taskId: string, payload: any) => withLoading(() => updateTaskTerminalConfig(projectName, taskId, payload)), [projectName, withLoading]);
  const getStatus = useCallback((taskId: string) => fetchTaskTerminalStatus(projectName, taskId), [projectName]);
  const getOutput = useCallback((taskId: string, cursor: number) => fetchTaskTerminalOutput(projectName, taskId, cursor), [projectName]);
  const getOverview = useCallback(() => fetchTerminalOverview(projectName), [projectName]);
  const getProjectConfig = useCallback(() => fetchTerminalConfig(projectName), [projectName]);
  const updateProjectConfig = useCallback((payload: any) => withLoading(() => updateTerminalConfig(projectName, payload)), [projectName, withLoading]);

  return {
    loading,
    error,
    start,
    stop,
    sendInput,
    resize,
    updateConfig,
    getProjectConfig,
    updateProjectConfig,
    getStatus,
    getOutput,
    getOverview
  };
}
