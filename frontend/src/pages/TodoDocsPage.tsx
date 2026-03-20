import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Shell from '../components/layout/Shell';
import TopBar from '../components/layout/TopBar';
import MarkdownPreview from '../components/MarkdownPreview';
import { useTodoDocs } from '../hooks/useTodoDocs';

type ViewMode = 'rendered' | 'source';

function DocPanel({ title, content, viewMode }: { title: string; content: string | null; viewMode: ViewMode }) {
  if (!content) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-white p-6">
        <p className="text-sm text-muted">{title} 暂无内容</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white">
      <div className="border-b border-border px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      </div>
      <div className="max-h-[calc(100vh-220px)] overflow-auto p-4">
        {viewMode === 'rendered' ? (
          <MarkdownPreview value={content} className="text-sm" compact />
        ) : (
          <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-700">{content}</pre>
        )}
      </div>
    </div>
  );
}

export default function TodoDocsPage() {
  const { projectName, taskId } = useParams<{ projectName: string; taskId: string }>();
  const [searchParams] = useSearchParams();
  const branch = searchParams.get('branch') || undefined;
  const { docs, loading, error } = useTodoDocs(projectName!, taskId!, branch);
  const [viewMode, setViewMode] = useState<ViewMode>('rendered');

  const backTo = `/projects/${projectName}/tasks/${taskId}`;

  const sourceLabel = docs?.source === 'archive' ? '(归档)' : docs?.source === 'local' ? '(本地)' : '';

  return (
    <>
      <TopBar
        title={`Todo 文档 ${sourceLabel}`}
        backTo={backTo}
        backLabel="返回任务详情"
        searchPlaceholder="Search"
      />

      <div className="mx-auto max-w-[1600px] px-3 py-3 md:px-4">
        {/* 顶部工具栏 */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">视图模式：</span>
            <div className="inline-flex rounded-md border border-border bg-white shadow-sm">
              <button
                onClick={() => setViewMode('rendered')}
                className={`px-3 py-1.5 text-xs font-medium ${
                  viewMode === 'rendered'
                    ? 'bg-primary text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                } rounded-l-md`}
              >
                渲染
              </button>
              <button
                onClick={() => setViewMode('source')}
                className={`px-3 py-1.5 text-xs font-medium ${
                  viewMode === 'source'
                    ? 'bg-primary text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                } rounded-r-md`}
              >
                源码
              </button>
            </div>
          </div>
          {docs?.source && (
            <span className="text-xs text-muted">
              数据来源：{docs.source === 'local' ? '本地文件系统' : docs.source === 'archive' ? 'xtask 数据分支' : '无'}
            </span>
          )}
        </div>

        {/* 文档面板 */}
        {loading ? (
          <p className="text-sm text-muted">加载中...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            <DocPanel title="task.md" content={docs?.task_md || null} viewMode={viewMode} />
            <DocPanel title="analysis.md" content={docs?.analysis_md || null} viewMode={viewMode} />
          </div>
        )}
      </div>
    </>
  );
}
