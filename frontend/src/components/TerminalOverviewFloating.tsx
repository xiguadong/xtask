import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTerminal } from '../hooks/useTerminal';
import { TerminalOverview } from '../types';

const EMPTY_OVERVIEW: TerminalOverview = {
  config: { max_terminals: 3 },
  counts: { total: 0, working: 0, waiting: 0, max: 3, available: 3 },
  items: []
};

interface TerminalOverviewFloatingProps {
  projectName: string;
  showConfig?: boolean;
  defaultExpanded?: boolean;
}

export default function TerminalOverviewFloating({
  projectName,
  showConfig = true,
  defaultExpanded = true
}: TerminalOverviewFloatingProps) {
  const { getOverview, updateProjectConfig } = useTerminal(projectName);
  const [overview, setOverview] = useState<TerminalOverview>(EMPTY_OVERVIEW);
  const [maxTerminalsDraft, setMaxTerminalsDraft] = useState(3);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      try {
        const data = await getOverview();
        if (!active) return;
        setOverview(data);
        setMaxTerminalsDraft(data?.config?.max_terminals || 3);
        setError(null);
      } catch {
        if (!active) return;
        setOverview(EMPTY_OVERVIEW);
        setError('加载终端概览失败');
      }
    };

    void loadOverview();
    const timer = window.setInterval(loadOverview, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [getOverview]);

  const visibleItems = useMemo(() => {
    if (expanded) return overview.items;
    return overview.items.slice(0, 2);
  }, [expanded, overview.items]);

  async function handleSaveConfig() {
    if (!showConfig) return;
    try {
      setSaving(true);
      setError(null);
      await updateProjectConfig({
        max_terminals: Math.max(1, Math.min(20, maxTerminalsDraft || 1))
      });
      const data = await getOverview();
      setOverview(data);
      setMaxTerminalsDraft(data?.config?.max_terminals || 3);
    } catch (err: any) {
      setError(err?.message || '保存终端上限失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 ${
        expanded ? 'w-[22rem] sm:w-[26rem]' : 'w-[18rem]'
      }`}
    >
      <div className="overflow-hidden rounded-xl border border-border bg-white/95 shadow-xl backdrop-blur">
        <header className="flex items-center justify-between border-b border-border px-3 py-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Terminal Overview</p>
            <p className="text-[11px] text-muted">
              活跃 {overview.counts.total} / {overview.counts.max}，可用 {overview.counts.available}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="rounded border border-border bg-white px-2 py-1 text-[11px] font-semibold text-muted hover:bg-slate-100"
          >
            {expanded ? '缩小' : '放大'}
          </button>
        </header>

        <div className="space-y-2 p-3 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded border border-green-100 bg-green-50 p-2">
              <p className="text-green-700">工作中</p>
              <p className="text-sm font-semibold text-green-700">{overview.counts.working}</p>
            </div>
            <div className="rounded border border-amber-100 bg-amber-50 p-2">
              <p className="text-amber-700">等待中</p>
              <p className="text-sm font-semibold text-amber-700">{overview.counts.waiting}</p>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 p-2">
              <p className="text-slate-600">可用</p>
              <p className="text-sm font-semibold text-slate-700">{overview.counts.available}</p>
            </div>
          </div>

          {showConfig && expanded && (
            <div className="rounded border border-border bg-slate-50 p-2">
              <p className="text-[11px] text-muted">最大终端数</p>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxTerminalsDraft}
                  onChange={(event) => setMaxTerminalsDraft(Number(event.target.value) || 1)}
                  className="w-20 rounded border border-border bg-white px-2 py-1 text-xs text-text"
                />
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="rounded border border-border bg-white px-2 py-1 text-[11px] font-semibold text-muted hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          )}

          {error && <p className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700">{error}</p>}

          {visibleItems.length === 0 ? (
            <p className="rounded border border-dashed border-border p-2 text-[11px] text-muted">暂无任务终端在运行</p>
          ) : (
            <div className={`${expanded ? 'max-h-64' : 'max-h-32'} space-y-2 overflow-y-auto pr-1`}>
              {visibleItems.map((item) => (
                <Link
                  key={item.sessionId}
                  to={`/projects/${projectName}/tasks/${item.taskId}`}
                  className="block rounded border border-border bg-slate-50 p-2 transition-colors hover:bg-slate-100"
                >
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
                  <p className="text-[10px] text-muted">
                    {item.mode === 'ssh' ? 'SSH' : '本地'} | 最后活动 {new Date(item.lastActiveAt).toLocaleTimeString()}
                  </p>
                </Link>
              ))}
              {!expanded && overview.items.length > visibleItems.length && (
                <p className="text-[10px] text-muted">还有 {overview.items.length - visibleItems.length} 个终端未展示</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
