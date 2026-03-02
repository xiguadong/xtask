import type { Relation } from '../lib/types';

export interface RelationBadges {
  parent: boolean;
  children: number;
  blockers: number;
  blockedBy: number;
  relatedStrong: number;
  relatedWeak: number;
}

export function buildRelationBadges(taskId: string, relations: Relation[]): RelationBadges {
  return relations.reduce<RelationBadges>(
    (acc, rel) => {
      if (rel.type === 'parent_child') {
        if (rel.target_id === taskId) acc.parent = true;
        if (rel.source_id === taskId) acc.children += 1;
      }
      if (rel.type === 'blocks') {
        if (rel.source_id === taskId) acc.blockers += 1;
        if (rel.target_id === taskId) acc.blockedBy += 1;
      }
      if (rel.type === 'related_strong' && (rel.source_id === taskId || rel.target_id === taskId)) {
        acc.relatedStrong += 1;
      }
      if (rel.type === 'related_weak' && (rel.source_id === taskId || rel.target_id === taskId)) {
        acc.relatedWeak += 1;
      }
      return acc;
    },
    { parent: false, children: 0, blockers: 0, blockedBy: 0, relatedStrong: 0, relatedWeak: 0 },
  );
}
