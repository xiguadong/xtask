import type { ProjectHealth, TaskStatus } from '../../lib/types';

type StatusValue = TaskStatus | ProjectHealth;

const classMap: Record<StatusValue, string> = {
  todo: 'bg-slate-100 text-slate-700 border-slate-300',
  doing: 'bg-blue-100 text-blue-700 border-blue-300',
  blocked: 'bg-red-100 text-red-700 border-red-300',
  done: 'bg-green-100 text-green-700 border-green-300',
  healthy: 'bg-green-100 text-green-700 border-green-300',
  at_risk: 'bg-amber-100 text-amber-700 border-amber-300',
};

export function StatusBadge({ status }: { status: StatusValue }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${classMap[status] || classMap.todo}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
