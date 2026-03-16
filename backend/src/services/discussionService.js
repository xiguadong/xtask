import yaml from 'js-yaml';
import { listDir, readYaml, writeFiles } from '../utils/gitDataStore.js';

function normalizeDiscussionLabel(label) {
  return String(label || '').trim().toLowerCase();
}

function normalizeDiscussionLabels(labels = []) {
  return Array.from(new Set((labels || []).map((label) => normalizeDiscussionLabel(label)).filter(Boolean)));
}

function createExcerpt(content = '', maxLength = 140) {
  const plainText = String(content || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+\]\([^)]+\)/g, '$1')
    .replace(/[#>*_\-\n\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText) return '';
  if (plainText.length <= maxLength) return plainText;
  return `${plainText.slice(0, maxLength).trim()}...`;
}

function normalizeComments(comments = []) {
  if (!Array.isArray(comments)) return [];

  return comments
    .map((comment) => {
      if (!comment || typeof comment !== 'object') return null;

      const id = String(comment.id || '').trim();
      const author = String(comment.author || '匿名').trim() || '匿名';
      const content = String(comment.content || '').trim();
      const created_at = comment.created_at || new Date().toISOString();

      if (!id || !content) return null;

      return {
        id,
        author,
        content,
        created_at
      };
    })
    .filter(Boolean)
    .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime());
}

function normalizeDiscussion(discussion) {
  if (!discussion) return null;

  const normalized = {
    id: String(discussion.id || '').trim(),
    title: String(discussion.title || '未命名讨论').trim() || '未命名讨论',
    content: String(discussion.content || ''),
    labels: normalizeDiscussionLabels(discussion.labels || []),
    comments: normalizeComments(discussion.comments || []),
    created_at: discussion.created_at || new Date().toISOString(),
    updated_at: discussion.updated_at || discussion.created_at || new Date().toISOString()
  };

  normalized.excerpt = createExcerpt(normalized.content);
  normalized.comment_count = normalized.comments.length;

  return normalized;
}

function createDiscussionId(title = 'discussion') {
  const slug = String(title || 'discussion')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'discussion';

  return `${Date.now()}-${slug}`;
}

function getDiscussionPath(id) {
  return `discussions/${id}/discussion.yaml`;
}

export function getDiscussions(projectPath) {
  const discussionDirs = listDir(projectPath, 'discussions');

  return discussionDirs
    .map((dir) => normalizeDiscussion(readYaml(projectPath, getDiscussionPath(dir))))
    .filter(Boolean)
    .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime());
}

export function getDiscussionById(projectPath, id) {
  return normalizeDiscussion(readYaml(projectPath, getDiscussionPath(id)));
}

export function createDiscussion(projectPath, payload = {}) {
  const now = new Date().toISOString();
  const discussion = normalizeDiscussion({
    id: createDiscussionId(payload.title),
    title: payload.title,
    content: payload.content || '',
    labels: payload.labels || [],
    comments: [],
    created_at: now,
    updated_at: now
  });

  writeFiles(projectPath, [
    { path: getDiscussionPath(discussion.id), content: yaml.dump(discussion) }
  ], 'xtask create discussion');

  return discussion;
}

export function updateDiscussion(projectPath, id, payload = {}) {
  const discussion = getDiscussionById(projectPath, id);
  if (!discussion) return null;

  const nextDiscussion = normalizeDiscussion({
    ...discussion,
    title: Object.prototype.hasOwnProperty.call(payload, 'title') ? payload.title : discussion.title,
    content: Object.prototype.hasOwnProperty.call(payload, 'content') ? payload.content : discussion.content,
    labels: Object.prototype.hasOwnProperty.call(payload, 'labels') ? payload.labels : discussion.labels,
    updated_at: new Date().toISOString()
  });

  writeFiles(projectPath, [
    { path: getDiscussionPath(id), content: yaml.dump(nextDiscussion) }
  ], 'xtask update discussion');

  return nextDiscussion;
}

export function addDiscussionComment(projectPath, id, payload = {}) {
  const discussion = getDiscussionById(projectPath, id);
  if (!discussion) return null;

  const content = String(payload.content || '').trim();
  if (!content) {
    throw new Error('评论内容不能为空');
  }

  const nextDiscussion = normalizeDiscussion({
    ...discussion,
    comments: [
      ...discussion.comments,
      {
        id: `comment-${Date.now()}`,
        author: String(payload.author || '匿名').trim() || '匿名',
        content,
        created_at: new Date().toISOString()
      }
    ],
    updated_at: new Date().toISOString()
  });

  writeFiles(projectPath, [
    { path: getDiscussionPath(id), content: yaml.dump(nextDiscussion) }
  ], 'xtask add discussion comment');

  return nextDiscussion;
}
