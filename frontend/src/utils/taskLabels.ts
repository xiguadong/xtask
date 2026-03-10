const labelPalette = [
  'border-rose-200 bg-rose-50 text-rose-700',
  'border-amber-200 bg-amber-50 text-amber-700',
  'border-emerald-200 bg-emerald-50 text-emerald-700',
  'border-sky-200 bg-sky-50 text-sky-700',
  'border-violet-200 bg-violet-50 text-violet-700',
  'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  'border-cyan-200 bg-cyan-50 text-cyan-700',
  'border-lime-200 bg-lime-50 text-lime-700'
];

export function normalizeTaskLabel(label: string) {
  return label.trim().toLowerCase();
}

export function normalizeTaskLabels(labels: string[] = []) {
  return Array.from(new Set(labels.map((label) => normalizeTaskLabel(label)).filter(Boolean)));
}

function hashLabel(label: string) {
  let hash = 0;
  for (let index = 0; index < label.length; index += 1) {
    hash = (hash * 33 + label.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getTaskLabelClassName(label: string) {
  return labelPalette[hashLabel(normalizeTaskLabel(label)) % labelPalette.length];
}
