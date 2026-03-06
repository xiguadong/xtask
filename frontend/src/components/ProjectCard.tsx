import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTerminalOverview } from '../utils/api';
import { Project, TerminalOverview } from '../types';

export default function ProjectCard({ project }: { project: Project }) {
  const [terminalOverview, setTerminalOverview] = useState<TerminalOverview | null>(null);
  const [terminalError, setTerminalError] = useState(false);

  const refreshJitterMs = useMemo(() => {
    const key = project.name || '';
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    return hash % 30_000;
  }, [project.name]);

  useEffect(() => {
    let active = true;
    let intervalId: number | null = null;

    const load = async () => {
      try {
        const data = await fetchTerminalOverview(project.name);
        if (!active) return;
        setTerminalOverview(data);
        setTerminalError(false);
      } catch {
        if (!active) return;
        setTerminalError(true);
      }
    };

    void load();

    const timeoutId = window.setTimeout(() => {
      void load();
      intervalId = window.setInterval(load, 180_000);
    }, 180_000 + refreshJitterMs);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [project.name, refreshJitterMs]);

  return (
    <Link
      to={`/projects/${project.name}`}
      className="block rounded-lg border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <h3 className="mb-1 text-base font-semibold text-text">{project.name}</h3>
      <p className="mb-3 truncate text-xs text-muted">{project.path}</p>
      <div className="flex gap-4 text-xs font-medium">
        <span className="text-primary">{project.taskCount || 0} tasks</span>
        <span className="text-success">{project.milestoneCount || 0} milestones</span>
      </div>

      <div className="mt-3 rounded-md border border-border bg-white p-3 text-xs">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Terminal</p>
            {terminalOverview ? (
              <p className="mt-1 text-[11px] text-muted">
                活跃 {terminalOverview.counts.total} / {terminalOverview.counts.max}，可用 {terminalOverview.counts.available}
              </p>
            ) : terminalError ? (
              <p className="mt-1 text-[11px] text-red-700">终端概览加载失败（3 分钟后自动重试）</p>
            ) : (
              <p className="mt-1 text-[11px] text-muted">加载终端概览中…</p>
            )}
          </div>
          <span className="rounded border border-border bg-slate-50 px-2 py-1 text-[10px] font-semibold text-muted">
            3 分钟刷新
          </span>
        </div>

        {terminalOverview && (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded border border-green-100 bg-green-50 p-2">
                <p className="text-green-700">工作中</p>
                <p className="text-sm font-semibold text-green-700">{terminalOverview.counts.working}</p>
              </div>
              <div className="rounded border border-amber-100 bg-amber-50 p-2">
                <p className="text-amber-700">等待中</p>
                <p className="text-sm font-semibold text-amber-700">{terminalOverview.counts.waiting}</p>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-2">
                <p className="text-slate-600">可用</p>
                <p className="text-sm font-semibold text-slate-700">{terminalOverview.counts.available}</p>
              </div>
            </div>

            {terminalOverview.items.length === 0 ? (
              <p className="mt-3 rounded border border-dashed border-border p-2 text-[11px] text-muted">
                暂无任务终端在运行
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {terminalOverview.items.slice(0, 2).map((item) => (
                  <div key={item.sessionId} className="rounded border border-border bg-slate-50 p-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-[11px] font-medium text-text">{item.taskTitle}</p>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          item.runtimeStatus === 'working' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.runtimeStatus === 'working' ? '工作中' : '等待'}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-muted">{item.taskId}</p>
                  </div>
                ))}
                {terminalOverview.items.length > 2 && (
                  <p className="text-[10px] text-muted">还有 {terminalOverview.items.length - 2} 个终端未展示</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Link>
  );
}
