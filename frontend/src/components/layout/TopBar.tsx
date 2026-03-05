import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface TopBarProps {
  title: string;
  backTo?: string;
  backLabel?: string;
  searchPlaceholder?: string;
  rightSlot?: ReactNode;
}

export default function TopBar({
  title,
  backTo,
  backLabel = 'Home',
  searchPlaceholder = 'Search',
  rightSlot
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-3 md:px-4">
        {backTo ? (
          <Link to={backTo} className="inline-flex items-center rounded-md border border-border px-2 py-1 text-xs hover:bg-slate-100">
            {backLabel}
          </Link>
        ) : (
          <Link to="/" className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white">
            xtask
          </Link>
        )}

        <h1 className="ml-1 text-sm font-semibold text-text">{title}</h1>

        <label className="relative ml-auto w-full max-w-xs text-xs">
          <input
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>

        {rightSlot}
      </div>
    </header>
  );
}
