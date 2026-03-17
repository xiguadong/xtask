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

export function generateTaskId(title) {
  const timestamp = formatTimestampForId();
  const slug = String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'task';

  return `${timestamp}-${slug}`;
}
