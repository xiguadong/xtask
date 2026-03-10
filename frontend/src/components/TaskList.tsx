import TaskCard from './TaskCard';
import { Task } from '../types';

export default function TaskList({
  tasks,
  projectName,
  currentSearch = '',
  emptyText = '暂无任务'
}: {
  tasks: Task[];
  projectName: string;
  currentSearch?: string;
  emptyText?: string;
}) {
  if (tasks.length === 0) {
    return <p className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} projectName={projectName} currentSearch={currentSearch} />
      ))}
    </div>
  );
}
