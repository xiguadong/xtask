import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  value: string;
  className?: string;
  compact?: boolean;
}

export default function MarkdownPreview({ value, className, compact = false }: MarkdownPreviewProps) {
  const heading1Class = compact ? 'mt-3 text-base font-semibold text-text' : 'mt-4 text-lg font-semibold text-text';
  const heading2Class = compact ? 'mt-3 text-sm font-semibold text-text' : 'mt-4 text-base font-semibold text-text';
  const heading3Class = compact ? 'mt-2 text-sm font-medium text-text' : 'mt-3 text-sm font-semibold text-text';
  const paragraphClass = compact ? 'mt-2 text-sm leading-7 text-text' : 'mt-2 leading-relaxed text-text';
  const listClass = compact ? 'mt-2 list-disc space-y-1 pl-5 text-sm text-text' : 'mt-2 list-disc space-y-1 pl-5 text-text';
  const orderedListClass = compact ? 'mt-2 list-decimal space-y-1 pl-5 text-sm text-text' : 'mt-2 list-decimal space-y-1 pl-5 text-text';
  const blockquoteClass = compact
    ? 'mt-3 border-l-2 border-border bg-slate-50 px-3 py-2 text-sm text-text'
    : 'mt-3 border-l-2 border-border bg-slate-50 px-3 py-2 text-text';

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className={heading1Class}>{children}</h1>,
          h2: ({ children }) => <h2 className={heading2Class}>{children}</h2>,
          h3: ({ children }) => <h3 className={heading3Class}>{children}</h3>,
          p: ({ children }) => <p className={paragraphClass}>{children}</p>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className={listClass}>{children}</ul>,
          ol: ({ children }) => <ol className={orderedListClass}>{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => <blockquote className={blockquoteClass}>{children}</blockquote>,
          hr: () => <hr className="my-4 border-border" />,
          code: ({ inline, children }) =>
            inline ? (
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[12px] text-slate-800">{children}</code>
            ) : (
              <code className="block overflow-x-auto whitespace-pre rounded bg-slate-950/90 p-3 font-mono text-[12px] text-slate-100">
                {children}
              </code>
            )
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}
