import { useEffect, useMemo, useState } from 'react';
import LabelBadge from '../LabelBadge';
import MarkdownEditor from '../MarkdownEditor';
import MarkdownPreview from '../MarkdownPreview';
import Shell from '../layout/Shell';
import { Discussion } from '../../types';
import { addDiscussionComment, createDiscussion, updateDiscussion } from '../../utils/api';
import { normalizeTaskLabel, normalizeTaskLabels } from '../../utils/taskLabels';
import { formatTaskDateTime } from '../../utils/taskDisplay';

type TemplateKey = 'blank' | 'meeting' | 'decision';

interface ProjectDiscussionContentProps {
  projectName: string;
  discussions: Discussion[];
  loading: boolean;
  availableLabels: string[];
  selectedDiscussionId: string;
  onSelectDiscussion: (id: string) => void;
  onClearDiscussion: () => void;
  onRefresh: () => void | Promise<void>;
}

const discussionTemplates: Record<TemplateKey, { title: string; content: string }> = {
  blank: {
    title: '',
    content: ''
  },
  meeting: {
    title: '会议纪要',
    content: '# 会议背景\n\n## 参会人\n- \n\n## 核心讨论\n- \n\n## 结论\n- \n\n## 待办\n- [ ] '
  },
  decision: {
    title: '决策记录',
    content: '# 决策背景\n\n## 备选方案\n- 方案 A\n- 方案 B\n\n## 最终决定\n\n## 原因\n\n## 风险与后续\n- [ ] '
  }
};

function emptyDraft() {
  return {
    title: '',
    content: '',
    labels: [] as string[]
  };
}

export default function ProjectDiscussionContent({
  projectName,
  discussions,
  loading,
  availableLabels,
  selectedDiscussionId,
  onSelectDiscussion,
  onClearDiscussion,
  onRefresh
}: ProjectDiscussionContentProps) {
  const [activeLabel, setActiveLabel] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createDraft, setCreateDraft] = useState(emptyDraft);
  const [createLabelInput, setCreateLabelInput] = useState('');
  const [detailDraft, setDetailDraft] = useState(emptyDraft);
  const [detailLabelInput, setDetailLabelInput] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedDiscussion = useMemo(
    () => discussions.find((discussion) => discussion.id === selectedDiscussionId) || null,
    [discussions, selectedDiscussionId]
  );

  const filteredDiscussions = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return discussions.filter((discussion) => {
      if (activeLabel && !discussion.labels.includes(activeLabel)) return false;
      if (!keyword) return true;

      const haystack = [discussion.title, discussion.excerpt, discussion.content, discussion.labels.join(' ')]
        .join(' ')
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [activeLabel, discussions, searchKeyword]);

  const overview = useMemo(() => {
    const comments = discussions.flatMap((discussion) => discussion.comments);
    const thisWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: discussions.length,
      newThisWeek: discussions.filter((discussion) => new Date(discussion.created_at).getTime() >= thisWeek).length,
      comments: comments.length
    };
  }, [discussions]);

  const recentComments = useMemo(() => {
    return discussions
      .flatMap((discussion) =>
        discussion.comments.map((comment) => ({
          ...comment,
          discussionId: discussion.id,
          discussionTitle: discussion.title
        }))
      )
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .slice(0, 6);
  }, [discussions]);

  const relatedDiscussions = useMemo(() => {
    if (!selectedDiscussion) return [];

    return discussions
      .filter((discussion) => discussion.id !== selectedDiscussion.id)
      .map((discussion) => ({
        discussion,
        score: discussion.labels.filter((label) => selectedDiscussion.labels.includes(label)).length
      }))
      .sort((left, right) => right.score - left.score || new Date(right.discussion.updated_at).getTime() - new Date(left.discussion.updated_at).getTime())
      .slice(0, 4)
      .map((item) => item.discussion);
  }, [discussions, selectedDiscussion]);

  useEffect(() => {
    if (selectedDiscussion) {
      setDetailDraft({
        title: selectedDiscussion.title,
        content: selectedDiscussion.content,
        labels: selectedDiscussion.labels
      });
      setCommentAuthor('');
      setCommentContent('');
      setDetailLabelInput('');
    }
  }, [selectedDiscussion]);

  useEffect(() => {
    if (!selectedDiscussionId) return;
    if (!selectedDiscussion && discussions.length > 0) {
      onClearDiscussion();
    }
  }, [discussions.length, onClearDiscussion, selectedDiscussion, selectedDiscussionId]);

  function openCreateForm(templateKey: TemplateKey) {
    const template = discussionTemplates[templateKey];
    setCreateDraft({
      title: template.title,
      content: template.content,
      labels: []
    });
    setCreateLabelInput('');
    setShowCreateForm(true);
  }

  function toggleCreateLabel(label: string) {
    const normalizedLabel = normalizeTaskLabel(label);
    setCreateDraft((current) => ({
      ...current,
      labels: current.labels.includes(normalizedLabel)
        ? current.labels.filter((item) => item !== normalizedLabel)
        : normalizeTaskLabels([...current.labels, normalizedLabel])
    }));
  }

  function toggleDetailLabel(label: string) {
    const normalizedLabel = normalizeTaskLabel(label);
    setDetailDraft((current) => ({
      ...current,
      labels: current.labels.includes(normalizedLabel)
        ? current.labels.filter((item) => item !== normalizedLabel)
        : normalizeTaskLabels([...current.labels, normalizedLabel])
    }));
  }

  function addCreateLabel() {
    const normalizedLabel = normalizeTaskLabel(createLabelInput);
    if (!normalizedLabel) return;
    setCreateDraft((current) => ({
      ...current,
      labels: normalizeTaskLabels([...current.labels, normalizedLabel])
    }));
    setCreateLabelInput('');
  }

  function addDetailLabel() {
    const normalizedLabel = normalizeTaskLabel(detailLabelInput);
    if (!normalizedLabel) return;
    setDetailDraft((current) => ({
      ...current,
      labels: normalizeTaskLabels([...current.labels, normalizedLabel])
    }));
    setDetailLabelInput('');
  }

  function insertTemplate(templateKey: Exclude<TemplateKey, 'blank'>) {
    const template = discussionTemplates[templateKey];
    setDetailDraft((current) => ({
      ...current,
      content: current.content.trim() ? `${current.content.trim()}\n\n${template.content}` : template.content
    }));
  }

  async function handleCreateDiscussion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const created = await createDiscussion(projectName, {
        title: createDraft.title || '未命名讨论',
        content: createDraft.content,
        labels: createDraft.labels
      });
      await onRefresh();
      setShowCreateForm(false);
      setCreateDraft(emptyDraft());
      onSelectDiscussion(created.id);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDiscussion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDiscussion) return;

    setSubmitting(true);
    try {
      await updateDiscussion(projectName, selectedDiscussion.id, {
        title: detailDraft.title || '未命名讨论',
        content: detailDraft.content,
        labels: detailDraft.labels
      });
      await onRefresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDiscussion) return;

    setSubmitting(true);
    try {
      await addDiscussionComment(projectName, selectedDiscussion.id, {
        author: commentAuthor,
        content: commentContent
      });
      setCommentContent('');
      await onRefresh();
    } finally {
      setSubmitting(false);
    }
  }

  const listSidebar = (
    <aside className="space-y-3 rounded-lg border border-border bg-surface p-3">
      <section className="space-y-2 rounded-md border border-border bg-white p-3 text-xs">
        <h2 className="font-semibold uppercase tracking-wide text-muted">Discussion 概览</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded border border-border bg-slate-50 p-2">
            <p className="text-muted">总数</p>
            <p className="font-semibold text-text">{overview.total}</p>
          </div>
          <div className="rounded border border-border bg-slate-50 p-2">
            <p className="text-muted">本周新增</p>
            <p className="font-semibold text-text">{overview.newThisWeek}</p>
          </div>
          <div className="rounded border border-border bg-slate-50 p-2">
            <p className="text-muted">总评论</p>
            <p className="font-semibold text-text">{overview.comments}</p>
          </div>
          <div className="rounded border border-border bg-slate-50 p-2">
            <p className="text-muted">筛选后</p>
            <p className="font-semibold text-text">{filteredDiscussions.length}</p>
          </div>
        </div>
      </section>

      <section className="space-y-2 rounded-md border border-border bg-white p-3 text-xs">
        <h3 className="font-semibold uppercase tracking-wide text-muted">快捷操作</h3>
        <div className="space-y-2">
          <button type="button" onClick={() => openCreateForm('blank')} className="w-full rounded-md border border-border px-3 py-2 text-left font-medium text-text hover:bg-slate-50">
            新建空白 Discussion
          </button>
          <button type="button" onClick={() => openCreateForm('meeting')} className="w-full rounded-md border border-border px-3 py-2 text-left font-medium text-text hover:bg-slate-50">
            会议纪要模板
          </button>
          <button type="button" onClick={() => openCreateForm('decision')} className="w-full rounded-md border border-border px-3 py-2 text-left font-medium text-text hover:bg-slate-50">
            决策记录模板
          </button>
        </div>
      </section>

      <section className="space-y-2 rounded-md border border-border bg-white p-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold uppercase tracking-wide text-muted">标签</h3>
          {activeLabel ? (
            <button type="button" onClick={() => setActiveLabel('')} className="rounded-md px-2 py-1 text-[11px] text-muted hover:bg-slate-100">
              清空
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {availableLabels.length > 0 ? (
            availableLabels.map((label) => (
              <LabelBadge key={label} label={label} selected={activeLabel === label} onClick={() => setActiveLabel(activeLabel === label ? '' : label)} />
            ))
          ) : (
            <p className="text-muted">当前项目暂无可复用标签</p>
          )}
        </div>
      </section>

      <section className="space-y-2 rounded-md border border-border bg-white p-3 text-xs">
        <h3 className="font-semibold uppercase tracking-wide text-muted">最近活跃</h3>
        {discussions.slice(0, 4).length > 0 ? (
          discussions.slice(0, 4).map((discussion) => (
            <button
              key={discussion.id}
              type="button"
              onClick={() => onSelectDiscussion(discussion.id)}
              className="block w-full rounded-md border border-border bg-slate-50 px-3 py-2 text-left hover:border-primary/30 hover:bg-white"
            >
              <p className="text-sm font-medium text-text">{discussion.title}</p>
              <p className="mt-1 text-[11px] text-muted">{formatTaskDateTime(discussion.updated_at)}</p>
            </button>
          ))
        ) : (
          <p className="text-muted">暂无 discussion</p>
        )}
      </section>
    </aside>
  );

  const listMain = (
    <section className="space-y-3" data-testid="project-discussion-list">
      <header className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text">Discussion 列表</h2>
            <p className="mt-1 text-xs text-muted">先浏览讨论预览，再点进具体 discussion 进入左右分栏的编辑与预览。</p>
          </div>
          <button onClick={() => openCreateForm('blank')} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover">
            新建讨论
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-xs">
          <input
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="搜索标题、摘要、正文"
            className="min-w-[14rem] flex-1 rounded border border-border bg-white px-3 py-2 text-sm"
          />
          <span className="rounded-full border border-border bg-slate-50 px-2 py-1 text-[11px] text-muted">
            {activeLabel ? `标签 ${activeLabel}` : '全部标签'}
          </span>
        </div>
      </header>

      {showCreateForm ? (
        <form onSubmit={handleCreateDiscussion} className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-text">新建 Discussion</h3>
            <button type="button" onClick={() => setShowCreateForm(false)} className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-slate-100">
              取消
            </button>
          </div>

          <input
            value={createDraft.title}
            onChange={(event) => setCreateDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="讨论标题"
            className="w-full rounded border border-border bg-white p-2 text-sm"
          />

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {createDraft.labels.map((label) => (
                <div key={label} className="inline-flex items-center gap-1 rounded-full border border-border bg-white pr-2 shadow-sm">
                  <LabelBadge label={label} />
                  <button type="button" onClick={() => toggleCreateLabel(label)} className="text-slate-500 hover:text-red-600">
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={createLabelInput}
                onChange={(event) => setCreateLabelInput(event.target.value)}
                placeholder="添加标签"
                className="flex-1 rounded border border-border bg-white p-2 text-sm"
              />
              <button type="button" onClick={addCreateLabel} className="rounded bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300">
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableLabels.map((label) => (
                <LabelBadge key={label} label={label} selected={createDraft.labels.includes(label)} onClick={() => toggleCreateLabel(label)} />
              ))}
            </div>
          </div>

          <MarkdownEditor
            name="discussion-create-content"
            value={createDraft.content}
            onChange={(value) => setCreateDraft((current) => ({ ...current, content: value }))}
            placeholder="输入 discussion 正文，支持 Markdown"
            hidePreview
          />

          <button type="submit" disabled={submitting} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
            创建并进入详情
          </button>
        </form>
      ) : null}

      {loading ? (
        <p className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">Discussion 加载中...</p>
      ) : filteredDiscussions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">当前筛选下暂无 discussion</p>
      ) : (
        <div className="space-y-3">
          {filteredDiscussions.map((discussion) => (
            <button
              key={discussion.id}
              type="button"
              onClick={() => onSelectDiscussion(discussion.id)}
              className="block w-full rounded-lg border border-border bg-surface p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted">discussion</p>
                  <h4 className="mt-1 text-base font-semibold text-text">{discussion.title}</h4>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{formatTaskDateTime(discussion.updated_at)}</span>
              </div>

              <p className="mb-3 text-sm leading-6 text-muted">{discussion.excerpt || '暂无预览内容'}</p>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">评论 {discussion.comment_count}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">创建于 {formatTaskDateTime(discussion.created_at)}</span>
                {discussion.labels.map((label) => (
                  <LabelBadge key={label} label={label} />
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );

  const listRail = (
    <aside className="space-y-3 rounded-lg border border-border bg-surface p-3">
      <section className="space-y-2 rounded-md border border-border bg-white p-3 text-xs">
        <h3 className="font-semibold uppercase tracking-wide text-muted">最新评论</h3>
        {recentComments.length > 0 ? (
          <div className="space-y-2">
            {recentComments.map((comment) => (
              <button
                key={comment.id}
                type="button"
                onClick={() => onSelectDiscussion(comment.discussionId)}
                className="block w-full rounded border border-border bg-slate-50 p-2 text-left hover:border-primary/30 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-text">{comment.author}</p>
                  <p className="text-[11px] text-muted">{formatTaskDateTime(comment.created_at)}</p>
                </div>
                <p className="mt-1 max-h-10 overflow-hidden text-[11px] leading-5 text-muted">{comment.content}</p>
                <p className="mt-2 text-[11px] text-slate-500">{comment.discussionTitle}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-muted">暂无评论</p>
        )}
      </section>
    </aside>
  );

  const detailSidebar = (
    <aside className="space-y-3 rounded-lg border border-border bg-surface p-3">
      <section className="space-y-2 rounded-md border border-border bg-white p-3 text-xs">
        <h2 className="font-semibold uppercase tracking-wide text-muted">文档信息</h2>
        <div className="space-y-2">
          <p><span className="text-muted">创建时间：</span>{selectedDiscussion ? formatTaskDateTime(selectedDiscussion.created_at) : '-'}</p>
          <p><span className="text-muted">最后更新：</span>{selectedDiscussion ? formatTaskDateTime(selectedDiscussion.updated_at) : '-'}</p>
          <p><span className="text-muted">评论数：</span>{selectedDiscussion?.comment_count || 0}</p>
        </div>
      </section>

      <section className="space-y-2 rounded-md border border-border bg-white p-3 text-xs">
        <h3 className="font-semibold uppercase tracking-wide text-muted">快捷操作</h3>
        <div className="space-y-2">
          <button type="button" onClick={() => insertTemplate('meeting')} className="w-full rounded-md border border-border px-3 py-2 text-left font-medium text-text hover:bg-slate-50">
            插入会议纪要模板
          </button>
          <button type="button" onClick={() => insertTemplate('decision')} className="w-full rounded-md border border-border px-3 py-2 text-left font-medium text-text hover:bg-slate-50">
            插入决策记录模板
          </button>
          <button type="button" onClick={onClearDiscussion} className="w-full rounded-md border border-border px-3 py-2 text-left font-medium text-text hover:bg-slate-50">
            返回列表
          </button>
        </div>
      </section>

      <section className="space-y-2 rounded-md border border-border bg-white p-3 text-xs">
        <h3 className="font-semibold uppercase tracking-wide text-muted">关联标签</h3>
        <div className="flex flex-wrap gap-2">
          {availableLabels.length > 0 ? (
            availableLabels.map((label) => (
              <LabelBadge key={label} label={label} selected={detailDraft.labels.includes(label)} onClick={() => toggleDetailLabel(label)} />
            ))
          ) : (
            <p className="text-muted">暂无项目标签</p>
          )}
        </div>
      </section>

      <section className="space-y-2 rounded-md border border-border bg-white p-3 text-xs">
        <h3 className="font-semibold uppercase tracking-wide text-muted">相关 Discussion</h3>
        {relatedDiscussions.length > 0 ? (
          relatedDiscussions.map((discussion) => (
            <button
              key={discussion.id}
              type="button"
              onClick={() => onSelectDiscussion(discussion.id)}
              className="block w-full rounded border border-border bg-slate-50 px-3 py-2 text-left hover:border-primary/30 hover:bg-white"
            >
              <p className="text-sm font-medium text-text">{discussion.title}</p>
              <p className="mt-1 text-[11px] text-muted">{discussion.excerpt || '暂无摘要'}</p>
            </button>
          ))
        ) : (
          <p className="text-muted">暂无相关讨论</p>
        )}
      </section>
    </aside>
  );

  const detailMain = (
    <section className="space-y-3 rounded-lg border border-border bg-surface p-4" data-testid="project-discussion-detail">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h2 className="text-sm font-semibold text-text">Discussion 详情</h2>
          <p className="mt-1 text-xs text-muted">正文在中栏编辑，右栏固定预览和评论，版式与任务页保持一致。</p>
        </div>
        <button type="button" onClick={onClearDiscussion} className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-slate-100">
          返回列表
        </button>
      </header>

      <form onSubmit={handleSaveDiscussion} className="space-y-3">
        <input
          value={detailDraft.title}
          onChange={(event) => setDetailDraft((current) => ({ ...current, title: event.target.value }))}
          placeholder="讨论标题"
          className="w-full rounded border border-border bg-white p-3 text-sm"
        />

        <div className="space-y-2 rounded-md border border-border bg-white p-3">
          <div className="flex flex-wrap gap-2">
            {detailDraft.labels.map((label) => (
              <div key={label} className="inline-flex items-center gap-1 rounded-full border border-border bg-white pr-2 shadow-sm">
                <LabelBadge label={label} />
                <button type="button" onClick={() => toggleDetailLabel(label)} className="text-slate-500 hover:text-red-600">
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={detailLabelInput}
              onChange={(event) => setDetailLabelInput(event.target.value)}
              placeholder="添加标签"
              className="flex-1 rounded border border-border bg-white p-2 text-sm"
            />
            <button type="button" onClick={addDetailLabel} className="rounded bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300">
              添加
            </button>
          </div>
        </div>

        <MarkdownEditor
          name="discussion-content"
          value={detailDraft.content}
          onChange={(value) => setDetailDraft((current) => ({ ...current, content: value }))}
          placeholder="输入 Markdown 内容"
          hidePreview
        />

        <button type="submit" disabled={submitting} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
          保存 discussion
        </button>
      </form>
    </section>
  );

  const detailRail = (
    <aside className="space-y-3 rounded-lg border border-border bg-surface p-3">
      <section className="rounded-md border border-border bg-white p-3">
        <div className="mb-3 border-b border-border pb-3">
          <h3 className="text-sm font-semibold text-text">实时预览</h3>
          <p className="mt-1 text-xs text-muted">右侧固定显示 Markdown 渲染结果。</p>
        </div>
        {detailDraft.content.trim() ? (
          <MarkdownPreview value={detailDraft.content} className="text-sm" compact />
        ) : (
          <p className="text-sm text-muted">暂无内容，开始输入 Markdown 即可预览。</p>
        )}
      </section>

      <section className="rounded-md border border-border bg-white p-3">
        <div className="mb-3 border-b border-border pb-3">
          <h3 className="text-sm font-semibold text-text">评论</h3>
          <p className="mt-1 text-xs text-muted">按时间倒序显示当前 discussion 的评论。</p>
        </div>

        <div className="space-y-2">
          {(selectedDiscussion?.comments || []).slice().reverse().map((comment) => (
            <div key={comment.id} className="rounded border border-border bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-text">{comment.author}</p>
                <p className="text-[11px] text-muted">{formatTaskDateTime(comment.created_at)}</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{comment.content}</p>
            </div>
          ))}
          {selectedDiscussion?.comments.length === 0 ? <p className="text-sm text-muted">暂无评论</p> : null}
        </div>

        <form onSubmit={handleAddComment} className="mt-3 space-y-2 border-t border-border pt-3">
          <input
            value={commentAuthor}
            onChange={(event) => setCommentAuthor(event.target.value)}
            placeholder="评论人"
            className="w-full rounded border border-border bg-white p-2 text-sm"
          />
          <textarea
            value={commentContent}
            onChange={(event) => setCommentContent(event.target.value)}
            placeholder="写下评论"
            rows={4}
            className="w-full rounded border border-border bg-white p-2 text-sm"
          />
          <button type="submit" disabled={submitting} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
            提交评论
          </button>
        </form>
      </section>
    </aside>
  );

  return selectedDiscussion ? (
    <Shell sidebar={detailSidebar} main={detailMain} rail={detailRail} />
  ) : (
    <Shell sidebar={listSidebar} main={listMain} rail={listRail} />
  );
}
