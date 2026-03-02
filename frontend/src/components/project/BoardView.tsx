import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { TASK_STATUSES } from '../../lib/constants';
import { useTaskStore } from '../../stores/taskStore';
import { BoardColumn } from './BoardColumn';
import type { TaskStatus } from '../../lib/types';

export function BoardView() {
  const tasks = useTaskStore((state) => state.tasks);
  const relations = useTaskStore((state) => state.relations);
  const selectedTaskId = useTaskStore((state) => state.selectedTaskId);
  const setSelectedTaskId = useTaskStore((state) => state.setSelectedTaskId);
  const moveTaskStatus = useTaskStore((state) => state.moveTaskStatus);

  function onDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id);
    const overId = event.over?.id;
    if (!overId || typeof overId !== 'string' || !overId.startsWith('column:')) {
      return;
    }
    const status = overId.split(':')[1] as TaskStatus;
    void moveTaskStatus(taskId, status);
  }

  return (
    <section className="grid gap-3 xl:grid-cols-4" data-testid="project-task-board">
      <DndContext onDragEnd={onDragEnd}>
        {TASK_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={tasks.filter((task) => task.status === status)}
            relations={relations}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
          />
        ))}
      </DndContext>
    </section>
  );
}
