import { Link } from 'react-router-dom';
import { StatusBadge } from '../shared/StatusBadge';
import type { ProjectSummary } from '../../lib/types';

interface ProjectCardProps {
  project: ProjectSummary;
  deleting?: boolean;
  onDelete?: (project: ProjectSummary) => void;
}

export function ProjectCard({ project, deleting = false, onDelete }: ProjectCardProps) {
  return (
    <div className="relative">
      <Link
        to={`/project/${project.id}`}
        className="block rounded-lg border border-border bg-surface p-3 pr-16 transition hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        data-testid="home-project-card"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-text">{project.name}</h3>
          <StatusBadge status={project.status} />
        </div>
        <p className="mt-1 line-clamp-1 text-xs text-muted">{project.active_milestone || 'No active milestone'}</p>
        <div className="mt-3 space-y-1 text-xs text-muted">
          <p>Progress: {project.progress}%</p>
          <p>Blocked: {project.blocked_count}</p>
          <p>Due soon: {project.due_soon ? 'Yes' : 'No'}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => onDelete?.(project)}
        disabled={deleting}
        className="absolute right-2 top-2 rounded border border-border bg-white px-2 py-1 text-[11px] font-medium text-danger hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={`Delete project ${project.name}`}
      >
        {deleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}
