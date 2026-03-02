import { MilestoneProgress } from './MilestoneProgress';
import { useTaskStore } from '../../stores/taskStore';

export function MilestoneList() {
  const milestones = useTaskStore((state) => state.milestones);

  return (
    <section className="space-y-2" aria-label="Milestones">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Milestones</h3>
      {milestones.length === 0 && <p className="text-xs text-muted">No milestones yet.</p>}
      {milestones.map((ms) => (
        <MilestoneProgress key={ms.id} milestone={ms} />
      ))}
    </section>
  );
}
