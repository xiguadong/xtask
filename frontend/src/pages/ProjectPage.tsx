import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BoardView } from '../components/project/BoardView';
import { EmptyState } from '../components/shared/EmptyState';
import { ErrorState } from '../components/shared/ErrorState';
import { FilterBar } from '../components/shared/FilterBar';
import { SkeletonCard } from '../components/shared/SkeletonCard';
import { ListView } from '../components/project/ListView';
import { PlanView } from '../components/project/PlanView';
import { FeatureView } from '../components/project/FeatureView';
import { TaskDrawer } from '../components/project/TaskDrawer';
import { TaskForm } from '../components/project/TaskForm';
import { Shell } from '../components/layout/Shell';
import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import { useFilterSync } from '../hooks/useFilter';
import { useKeyboard } from '../hooks/useKeyboard';
import { useTaskStore } from '../stores/taskStore';

export function ProjectPage() {
  const { id = '' } = useParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const graph = useTaskStore((state) => state.graph);
  const tasks = useTaskStore((state) => state.tasks);
  const loading = useTaskStore((state) => state.loading);
  const error = useTaskStore((state) => state.error);
  const viewMode = useTaskStore((state) => state.viewMode);
  const setProject = useTaskStore((state) => state.setProject);
  const setViewMode = useTaskStore((state) => state.setViewMode);
  const refreshTasks = useTaskStore((state) => state.refreshTasks);
  const setSelectedTaskId = useTaskStore((state) => state.setSelectedTaskId);

  useFilterSync();

  useEffect(() => {
    void setProject(id);
  }, [id, setProject]);

  useKeyboard({
    onNewTask: () => setShowCreateForm(true),
    onSearch: () => searchRef.current?.focus(),
    onEscape: () => {
      setSelectedTaskId('');
      setShowCreateForm(false);
    },
  });

  const content = useMemo(() => {
    if (loading) {
      return (
        <section className="grid gap-2 lg:grid-cols-2 xl:grid-cols-4">
          {[...Array(8)].map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </section>
      );
    }
    if (error) {
      return <ErrorState message={error} onRetry={() => void refreshTasks()} />;
    }
    if (tasks.length === 0) {
      return (
        <EmptyState
          title="No tasks yet"
          description="Create your first task with N shortcut or New Task button."
          actionLabel="Create Task"
          onAction={() => setShowCreateForm(true)}
        />
      );
    }
    if (viewMode === 'board') {
      return <BoardView />;
    }
    if (viewMode === 'list') {
      return <ListView />;
    }
    if (viewMode === 'plan') {
      return <PlanView />;
    }
    return <FeatureView />;
  }, [error, loading, refreshTasks, tasks.length, viewMode]);

  return (
    <>
      <TopBar
        projectName={graph?.project.name}
        viewMode={viewMode}
        onChangeView={setViewMode}
        onNewTask={() => setShowCreateForm(true)}
        searchRef={searchRef}
      />

      <Shell
        sidebar={<Sidebar />}
        main={
          <section className="space-y-3" data-testid="project-detail-board">
            <FilterBar />
            {content}
          </section>
        }
      />

      {showCreateForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-xl rounded-lg border border-border bg-white p-4 shadow-xl">
            <TaskForm onClose={() => setShowCreateForm(false)} />
          </div>
        </div>
      )}

      <TaskDrawer />
    </>
  );
}
