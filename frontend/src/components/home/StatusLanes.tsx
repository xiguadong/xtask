import type { ProjectSummary } from '../../lib/types';
import { ProjectCard } from './ProjectCard';

interface StatusLanesProps {
  projects: ProjectSummary[];
  onToggleStatus: (status: '' | 'healthy' | 'at_risk' | 'blocked') => void;
  selectedStatus: '' | 'healthy' | 'at_risk' | 'blocked';
  deletingProjectId?: string;
  onDeleteProject?: (project: ProjectSummary) => void;
}

const lanes: Array<{ key: 'healthy' | 'at_risk' | 'blocked'; label: string }> = [
  { key: 'healthy', label: 'Healthy' },
  { key: 'at_risk', label: 'At Risk' },
  { key: 'blocked', label: 'Blocked' },
];

export function StatusLanes({ projects, onToggleStatus, selectedStatus, deletingProjectId = '', onDeleteProject }: StatusLanesProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-3" data-testid="home-status-lanes">
      {lanes.map((lane) => {
        const laneProjects = projects.filter((project) => project.status === lane.key);
        return (
          <article key={lane.key} className="rounded-lg border border-border bg-white p-3">
            <button
              type="button"
              className={`mb-3 inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
                selectedStatus === lane.key ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
              }`}
              onClick={() => onToggleStatus(lane.key)}
            >
              {lane.label} ({laneProjects.length})
            </button>
            <div className="space-y-2">
              {laneProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  deleting={deletingProjectId === project.id}
                  onDelete={onDeleteProject}
                />
              ))}
              {laneProjects.length === 0 && <p className="text-xs text-muted">No projects in this lane.</p>}
            </div>
          </article>
        );
      })}
    </section>
  );
}
