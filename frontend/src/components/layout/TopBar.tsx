import { ArrowLeft, LayoutGrid, List, Plus, Search } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { RefObject } from 'react';

interface TopBarProps {
  projectName?: string;
  viewMode?: 'board' | 'list';
  onToggleView?: () => void;
  onNewTask?: () => void;
  searchRef?: RefObject<HTMLInputElement>;
}

export function TopBar({ projectName, viewMode, onToggleView, onNewTask, searchRef }: TopBarProps) {
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
            <button
              type="button"
              onClick={onToggleView}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-slate-100"
            >
              {viewMode === 'board' ? <List className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
              {viewMode === 'board' ? 'List' : 'Board'}
            </button>
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
