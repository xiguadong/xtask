import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  value: string;
  className?: string;
}

export default function MarkdownPreview({ value, className }: MarkdownPreviewProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mt-4 text-lg font-semibold text-text">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-4 text-base font-semibold text-text">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-3 text-sm font-semibold text-text">{children}</h3>,
          p: ({ children }) => <p className="mt-2 leading-relaxed text-text">{children}</p>,
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
          ul: ({ children }) => <ul className="mt-2 list-disc space-y-1 pl-5 text-text">{children}</ul>,
          ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5 text-text">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mt-3 border-l-2 border-border bg-slate-50 px-3 py-2 text-text">{children}</blockquote>
          ),
          hr: () => <hr className="my-4 border-border" />,
          code: ({ inline, children }) =>
            inline ? (
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[12px] text-slate-800">{children}</code>
            ) : (
              <code className="block whitespace-pre overflow-x-auto rounded bg-slate-950/90 p-3 font-mono text-[12px] text-slate-100">
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

