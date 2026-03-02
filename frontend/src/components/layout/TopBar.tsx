import { ArrowLeft, LayoutGrid, List, Plus, Search } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { RefObject } from 'react';
import type { ProjectViewMode } from '../../lib/types';

interface TopBarProps {
  projectName?: string;
  viewMode?: ProjectViewMode;
  onChangeView?: (mode: ProjectViewMode) => void;
  onNewTask?: () => void;
  searchRef?: RefObject<HTMLInputElement>;
}

const VIEW_OPTIONS: Array<{ mode: ProjectViewMode; label: string; icon: typeof LayoutGrid }> = [
  { mode: 'board', label: 'Board', icon: LayoutGrid },
  { mode: 'list', label: 'List', icon: List },
  { mode: 'plan', label: 'Plan', icon: LayoutGrid },
  { mode: 'feature', label: 'Feature', icon: LayoutGrid },
];

export function TopBar({ projectName, viewMode, onChangeView, onNewTask, searchRef }: TopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isProject = location.pathname.startsWith('/project/');

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-3 md:px-4">
        {isProject ? (
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-slate-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Home
          </button>
        ) : (
          <Link to="/" className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white">
            xtask
          </Link>
        )}

        <h1 className="ml-1 text-sm font-semibold text-text">{projectName || 'Project Overview'}</h1>

        <label className="relative ml-auto w-full max-w-xs text-xs">
          <Search className="pointer-events-none absolute left-2 top-2 h-3.5 w-3.5 text-muted" aria-hidden="true" />
          <input
            ref={searchRef}
            aria-label={isProject ? 'Search task' : 'Search project'}
            placeholder={isProject ? 'Search task (/)' : 'Search project'}
            className="w-full rounded-md border border-border bg-white py-1.5 pl-7 pr-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>

        {isProject && (
          <>
            <div className="inline-flex overflow-hidden rounded-md border border-border bg-white">
              {VIEW_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = viewMode === option.mode;
                return (
                  <button
                    key={option.mode}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChangeView?.(option.mode)}
                    className={`inline-flex items-center gap-1 border-r border-border px-2 py-1 text-xs font-medium last:border-r-0 ${
                      active ? 'bg-primary text-white hover:bg-primary-hover' : 'hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={onNewTask}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white hover:bg-primary-hover"
              data-testid="new-task-button"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              New Task
            </button>
          </>
        )}
      </div>
    </header>
  );
}
