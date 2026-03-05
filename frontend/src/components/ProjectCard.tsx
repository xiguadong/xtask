import { Link } from 'react-router-dom';
import { Project } from '../types';

export default function ProjectCard({ project }: { project: Project }) {
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
    </Link>
  );
}
