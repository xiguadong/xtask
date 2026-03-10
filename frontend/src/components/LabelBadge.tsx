import { getTaskLabelClassName, normalizeTaskLabel } from '../utils/taskLabels';

interface LabelBadgeProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}

export default function LabelBadge({ label, selected = false, onClick }: LabelBadgeProps) {
  const normalizedLabel = normalizeTaskLabel(label);
  const colorClassName = getTaskLabelClassName(normalizedLabel);

  if (!onClick) {
    return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium leading-5 ${colorClassName}`}>{normalizedLabel}</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium leading-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${colorClassName} ${
        selected ? 'border-current bg-current/10 shadow-sm ring-2 ring-current/25' : 'bg-white/70 opacity-80 hover:bg-white hover:opacity-100'
      }`}
    >
      {normalizedLabel}
    </button>
  );
}
