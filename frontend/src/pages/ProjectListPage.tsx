import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import ProjectCard from '../components/ProjectCard';
import Shell from '../components/layout/Shell';
import TopBar from '../components/layout/TopBar';
import { fetchTerminalOverview } from '../utils/api';
import { TerminalOverview } from '../types';

export default function ProjectListPage() {
  const { projects, loading, refresh } = useProjects();
  const totalTasks = projects.reduce((sum, project) => sum + (project.taskCount || 0), 0);
  const totalMilestones = projects.reduce((sum, project) => sum + (project.milestoneCount || 0), 0);
  const [overviewTick, setOverviewTick] = useState(0);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [terminalOverviews, setTerminalOverviews] = useState<Record<string, TerminalOverview>>({});

  const activeTerminalCount = useMemo(
    () => Object.values(terminalOverviews).reduce((sum, overview) => sum + (overview?.counts?.total || 0), 0),
    [terminalOverviews]
  );

  useEffect(() => {
    if (projects.length === 0) {
      setTerminalOverviews({});
      setOverviewLoading(false);
      return;
    }

    let active = true;

    const loadOverviews = async () => {
      setOverviewLoading(true);
      const results = await Promise.all(
        projects.map(async (project) => {
          try {
            const data = await fetchTerminalOverview(project.name);
            return { name: project.name, data };
          } catch {
            return null;
          }
        })
      );
      if (!active) return;

      const nextMap: Record<string, TerminalOverview> = {};
      results.forEach((item) => {
        if (item) nextMap[item.name] = item.data;
      });
      setTerminalOverviews(nextMap);
      setOverviewLoading(false);
    };

    void loadOverviews();
    const timer = window.setInterval(loadOverviews, 8000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [projects, overviewTick]);

  function handleRefreshAll() {
    refresh();
    setOverviewTick((value) => value + 1);
  }

  return (
    <>
      <TopBar
        title="Project Overview"
        searchPlaceholder="Search project"
        rightSlot={
          <button
            onClick={handleRefreshAll}
            className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white hover:bg-primary-hover"
          >
            Refresh
          </button>
        }
      />

      <Shell
        sidebar={
          <aside className="space-y-3 rounded-lg border border-border bg-surface p-3">
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Navigation</h2>
              <p className="text-xs text-muted">Use CLI or API to create/remove projects.</p>
            </section>
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Quick Stats</h3>
              <div className="rounded-md border border-border bg-white p-2 text-xs text-muted">
                {projects.length} registered projects
              </div>
            </section>
          </aside>
        }
        main={
          <section className="space-y-3">
            <header className="rounded-lg border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold text-text">Projects</h2>
              <p className="mt-1 text-xs text-muted">Layout aligned with xtask home dashboard shell.</p>
            </header>
            <section className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-text">Terminal Overview Board</h3>
                  <p className="mt-1 text-xs text-muted">所有项目终端会话汇总（活跃 {activeTerminalCount}）</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOverviewTick((value) => value + 1)}
                  className="rounded-md border border-border bg-white px-2 py-1 text-xs font-semibold text-muted hover:bg-slate-100"
                >
                  刷新终端
                </button>
              </div>

              {overviewLoading && projects.length > 0 ? (
                <div className="mt-4 flex items-center justify-center rounded-lg border border-border bg-white py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {projects.map((project) => {
                    const overview = terminalOverviews[project.name];
                    return (
                      <div key={project.name} className="rounded-md border border-border bg-white p-3 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-text">{project.name}</p>
                            <p className="mt-1 text-[11px] text-muted line-clamp-1">{project.path}</p>
                          </div>
                          <Link
                            to={`/projects/${project.name}`}
                            className="rounded border border-border bg-white px-2 py-1 text-[11px] font-semibold text-muted hover:bg-slate-100"
                          >
                            打开
                          </Link>
                        </div>

                        {!overview ? (
                          <p className="mt-3 rounded border border-dashed border-border p-2 text-[11px] text-muted">暂无终端概览</p>
                        ) : (
                          <>
                            <div className="mt-3 grid grid-cols-3 gap-2">
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
                            {overview.items.length === 0 ? (
                              <p className="mt-3 rounded border border-dashed border-border p-2 text-[11px] text-muted">暂无任务终端在运行</p>
                            ) : (
                              <div className="mt-3 space-y-2">
                                {overview.items.slice(0, 3).map((item) => (
                                  <Link
                                    key={item.sessionId}
                                    to={`/projects/${project.name}/tasks/${item.taskId}`}
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
                                  </Link>
                                ))}
                                {overview.items.length > 3 && (
                                  <p className="text-[10px] text-muted">还有 {overview.items.length - 3} 个终端未展示</p>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            {loading ? (
              <div className="flex items-center justify-center rounded-lg border border-border bg-surface py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.name} project={project} />
                ))}
              </div>
            )}
          </section>
        }
        rail={
          <aside className="space-y-3 rounded-lg border border-border bg-surface p-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="rounded-md border border-border bg-white p-3">
                <p className="text-xs text-muted">Projects</p>
                <p className="text-lg font-semibold text-text">{projects.length}</p>
              </div>
              <div className="rounded-md border border-border bg-white p-3">
                <p className="text-xs text-muted">Tasks</p>
                <p className="text-lg font-semibold text-text">{totalTasks}</p>
              </div>
              <div className="rounded-md border border-border bg-white p-3">
                <p className="text-xs text-muted">Milestones</p>
                <p className="text-lg font-semibold text-text">{totalMilestones}</p>
              </div>
            </div>
          </aside>
        }
      />
    </>
  );
}
