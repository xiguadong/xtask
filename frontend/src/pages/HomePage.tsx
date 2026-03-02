import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import { Sidebar } from '../components/layout/Sidebar';
import { StatusLanes } from '../components/home/StatusLanes';
import { SummaryRail } from '../components/home/SummaryRail';
import { EmptyState } from '../components/shared/EmptyState';
import { ErrorState } from '../components/shared/ErrorState';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { TopBar } from '../components/layout/TopBar';
import { useProjectStore } from '../stores/projectStore';

export function HomePage() {
  const [params, setParams] = useSearchParams();
  const projects = useProjectStore((state) => state.projects);
  const summary = useProjectStore((state) => state.summary);
  const loading = useProjectStore((state) => state.loading);
  const error = useProjectStore((state) => state.error);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const statusFilter = useProjectStore((state) => state.statusFilter);
  const setStatusFilter = useProjectStore((state) => state.setStatusFilter);

  useEffect(() => {
    const status = params.get('status') as '' | 'healthy' | 'at_risk' | 'blocked' | null;
    if (status) {
      setStatusFilter(status);
    }
    void fetchProjects();
  }, [fetchProjects, params, setStatusFilter]);

  const visibleProjects = useMemo(() => {
    if (!statusFilter) return projects;
    return projects.filter((project) => project.status === statusFilter);
  }, [projects, statusFilter]);

  function handleToggle(status: '' | 'healthy' | 'at_risk' | 'blocked') {
    setStatusFilter(status);
    if (!status || status === statusFilter) {
      params.delete('status');
    } else {
      params.set('status', status);
    }
    setParams(params, { replace: true });
  }

  let content = (
    <StatusLanes projects={visibleProjects} onToggleStatus={handleToggle} selectedStatus={statusFilter} />
  );

  if (loading) {
    content = (
      <section className="grid gap-2 lg:grid-cols-3" data-testid="home-overview-skeleton">
        {[...Array(6)].map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </section>
    );
  }

  if (error) {
    content = <ErrorState message={error} onRetry={() => void fetchProjects()} />;
  }

  if (!loading && !error && projects.length === 0) {
    content = (
      <EmptyState
        title="No registered projects"
        description="Use API POST /api/projects to register local project directories."
      />
    );
  }

  return (
    <>
      <TopBar />
      <Shell
        sidebar={<Sidebar home />}
        main={<section data-testid="home-overview-board">{content}</section>}
        rail={<SummaryRail summary={summary} />}
      />
    </>
  );
}
