import { useMemo, useRef, useState } from 'react';
import MarkdownPreview from './MarkdownPreview';

type ViewMode = 'write' | 'preview' | 'split';

interface MarkdownEditorProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hidePreview?: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function MarkdownEditor({ name, value, onChange, placeholder, hidePreview = false }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [view, setView] = useState<ViewMode>(hidePreview ? 'write' : 'split');
  const effectiveView = hidePreview ? 'write' : view;

  const stats = useMemo(() => {
    const text = value || '';
    const lines = text ? text.split('\n').length : 0;
    const chars = text.length;
    return { lines, chars };
  }, [value]);

  function focusWithSelection(start: number, end: number) {
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(start, end);
    });
  }

  function wrapSelection(prefix: string, suffix = prefix, fallbackText = '文本') {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.slice(start, end) || fallbackText;
    const next = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`;
    onChange(next);
    const nextStart = start + prefix.length;
    const nextEnd = nextStart + selected.length;
    focusWithSelection(nextStart, nextEnd);
  }

  function prefixLines(prefix: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;

    const before = value.slice(0, start);
    const selected = value.slice(start, end);
    const after = value.slice(end);

    const selectedLines = (selected || '').split('\n');
    const nextSelected = selectedLines.map((line) => (line ? `${prefix}${line}` : prefix.trimEnd())).join('\n');
    const next = `${before}${nextSelected}${after}`;
    onChange(next);

    const delta = nextSelected.length - selected.length;
    focusWithSelection(start, clamp(end + delta, 0, next.length));
  }

  function insertText(text: string, cursorOffset = text.length) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const next = `${value.slice(0, start)}${text}${value.slice(end)}`;
    onChange(next);
    const nextCursor = start + cursorOffset;
    focusWithSelection(nextCursor, nextCursor);
  }

  const toolbarButton =
    'rounded border border-border bg-white px-2 py-1 text-[11px] font-semibold text-muted hover:bg-slate-100 active:translate-y-px';

  return (
    <div className="rounded-md border border-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-slate-50 px-2 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" className={toolbarButton} onClick={() => wrapSelection('**', '**', '加粗文本')}>
            加粗
          </button>
          <button type="button" className={toolbarButton} onClick={() => wrapSelection('*', '*', '斜体文本')}>
            斜体
          </button>
          <button type="button" className={toolbarButton} onClick={() => wrapSelection('`', '`', 'code')}>
            行内代码
          </button>
          <button type="button" className={toolbarButton} onClick={() => wrapSelection('```\n', '\n```\n', '代码块')}>
            代码块
          </button>
          <button type="button" className={toolbarButton} onClick={() => prefixLines('- ')}>
            列表
          </button>
          <button type="button" className={toolbarButton} onClick={() => prefixLines('> ')}>
            引用
          </button>
          <button
            type="button"
            className={toolbarButton}
            onClick={() => insertText('[链接文字](https://example.com)', '[链接文字]('.length)}
          >
            链接
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden text-[11px] text-muted md:block">
            {stats.lines} 行 / {stats.chars} 字符
          </div>
          {!hidePreview ? (
            <div className="inline-flex overflow-hidden rounded border border-border bg-white text-[11px]">
              <button
                type="button"
                onClick={() => setView('write')}
                className={`px-2 py-1 font-semibold ${view === 'write' ? 'bg-primary text-white' : 'text-muted hover:bg-slate-100'}`}
              >
                编辑
              </button>
              <button
                type="button"
                onClick={() => setView('split')}
                className={`px-2 py-1 font-semibold ${view === 'split' ? 'bg-primary text-white' : 'text-muted hover:bg-slate-100'}`}
              >
                分屏
              </button>
              <button
                type="button"
                onClick={() => setView('preview')}
                className={`px-2 py-1 font-semibold ${view === 'preview' ? 'bg-primary text-white' : 'text-muted hover:bg-slate-100'}`}
              >
                预览
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className={`grid gap-0 ${effectiveView === 'split' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        {effectiveView !== 'preview' && (
          <div className={effectiveView === 'split' ? 'border-b border-border md:border-b-0 md:border-r' : ''}>
            <textarea
              ref={textareaRef}
              name={name}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={placeholder}
              rows={12}
              className="h-full w-full resize-y bg-white p-3 font-mono text-sm leading-relaxed text-text md:min-h-[18rem]"
            />
          </div>
        )}

        {effectiveView !== 'write' && (
          <div className="bg-white p-3 md:min-h-[18rem]">
            {value.trim() ? (
              <MarkdownPreview value={value} className="text-sm" />
            ) : (
              <div className="text-sm text-muted">暂无内容，开始输入 Markdown 即可预览。</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
