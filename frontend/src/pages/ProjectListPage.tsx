import { useProjects } from '../hooks/useProjects';
import ProjectCard from '../components/ProjectCard';
import Shell from '../components/layout/Shell';
import TopBar from '../components/layout/TopBar';

export default function ProjectListPage() {
  const { projects, loading, refresh } = useProjects();
  const totalTasks = projects.reduce((sum, project) => sum + (project.taskCount || 0), 0);
  const totalMilestones = projects.reduce((sum, project) => sum + (project.milestoneCount || 0), 0);

  function handleRefreshAll() {
    refresh();
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
