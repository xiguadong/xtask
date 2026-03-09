const DESCRIPTION_FILE_CHAR_LIMIT = 1200;
const DESCRIPTION_FILE_LINE_LIMIT = 24;
const DESCRIPTION_PREVIEW_CHAR_LIMIT = 240;
const DESCRIPTION_PREVIEW_LINE_LIMIT = 6;

function normalizeText(value) {
  return typeof value === 'string' ? value.replace(/\r\n/g, '\n') : '';
}

function countLines(value) {
  if (!value) return 0;
  return value.split('\n').length;
}

function trimTrailingWhitespace(value) {
  return value.replace(/[\t ]+$/gm, '').trim();
}

export function getTaskDescriptionFilePath(taskId) {
  return `tasks/${taskId}/description.md`;
}

export function getTaskSummaryFilePath(taskId) {
  return `tasks/${taskId}/summary.md`;
}

export function shouldStoreDescriptionInFile(content, forceFile = false) {
  const normalized = normalizeText(content);
  if (!normalized.trim()) return Boolean(forceFile);
  return forceFile || normalized.length > DESCRIPTION_FILE_CHAR_LIMIT || countLines(normalized) > DESCRIPTION_FILE_LINE_LIMIT;
}

export function buildDescriptionPreview(content) {
  const normalized = trimTrailingWhitespace(normalizeText(content));
  if (!normalized) return '';

  const limitedLines = normalized.split('\n').slice(0, DESCRIPTION_PREVIEW_LINE_LIMIT);
  let preview = limitedLines.join('\n');
  if (preview.length > DESCRIPTION_PREVIEW_CHAR_LIMIT) {
    preview = preview.slice(0, DESCRIPTION_PREVIEW_CHAR_LIMIT);
  }
  preview = preview.trimEnd();

  if (preview.length < normalized.length) {
    preview = `${preview}…`;
  }

  return preview;
}

export function prepareTaskDescription(taskId, description, options = {}) {
  const normalized = normalizeText(description);
  const forceFile = options.forceFile === true;
  const existingPath = options.existingPath || null;
  const descriptionPath = existingPath || getTaskDescriptionFilePath(taskId);
  const shouldUseFile = shouldStoreDescriptionInFile(normalized, forceFile);

  if (!shouldUseFile) {
    return {
      description: normalized,
      description_file: null,
      changes: existingPath ? [{ path: existingPath, delete: true }] : []
    };
  }

  return {
    description: buildDescriptionPreview(normalized),
    description_file: descriptionPath,
    changes: [
      {
        path: descriptionPath,
        content: normalized || '# 任务描述\n\n'
      }
    ]
  };
}
