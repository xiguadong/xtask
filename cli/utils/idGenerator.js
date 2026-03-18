function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

function formatTimestampForId(date = new Date()) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
    pad(date.getMilliseconds(), 3)
  ].join('-');
}

function hashText(value = '') {
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash * 33 + char.codePointAt(0)) >>> 0;
  }
  return hash.toString(36);
}

function createTaskIdSlug(title) {
  const asciiSlug = String(title || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (asciiSlug) {
    return asciiSlug;
  }

  const fallbackHash = hashText(String(title || '').trim()).slice(0, 8);
  return fallbackHash ? `task-${fallbackHash}` : 'task';
}

export function generateTaskId(title) {
  const timestamp = formatTimestampForId();
  const slug = createTaskIdSlug(title);

  return `${timestamp}-${slug}`;
}
