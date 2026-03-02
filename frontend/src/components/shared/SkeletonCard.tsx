export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-border bg-surface p-3">
      <div className="h-3 w-2/3 rounded bg-slate-200" />
      <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
      <div className="mt-3 h-2 w-1/3 rounded bg-slate-200" />
    </div>
  );
}
