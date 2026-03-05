import TaskCard from './TaskCard';
import { Task } from '../types';

export default function TaskList({ tasks, projectName }: { tasks: Task[]; projectName: string }) {
  if (tasks.length === 0) {
    return <p className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">No tasks</p>;
  }

  return (
    <div className="space-y-2">
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} projectName={projectName} />
      ))}
    </div>
  );
}
