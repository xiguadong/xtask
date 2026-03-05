import path from 'path';
import { readYaml, writeYaml } from '../utils/yamlHelper.js';
import { fileExists } from '../utils/fileSystem.js';

function normalizeGoals(goals) {
  if (!Array.isArray(goals)) return [];

  return goals
    .map((goal) => {
      if (typeof goal === 'string') {
        const title = goal.trim();
        return title ? { title, done: false } : null;
      }

      if (!goal || typeof goal !== 'object') return null;
      const title = String(goal.title || '').trim();
      if (!title) return null;

      return {
        title,
        done: Boolean(goal.done)
      };
    })
    .filter(Boolean);
}

export function getMilestones(projectPath) {
  const milestonesFile = path.join(projectPath, '.xtask', 'milestones.yaml');
  if (!fileExists(milestonesFile)) return [];
  const data = readYaml(milestonesFile);
  return (data?.milestones || []).map((milestone) => ({
    ...milestone,
    goals: normalizeGoals(milestone.goals)
  }));
}

export function createMilestone(projectPath, milestone) {
  const milestonesFile = path.join(projectPath, '.xtask', 'milestones.yaml');
  const milestones = getMilestones(projectPath);

  const id = `m${milestones.length + 1}`;
  const newMilestone = {
    id,
    name: milestone.name,
    description: milestone.description || '',
    due_date: milestone.due_date || null,
    status: 'active',
    goals: normalizeGoals(milestone.goals)
  };

  milestones.push(newMilestone);
  writeYaml(milestonesFile, { milestones });
  return newMilestone;
}

export function updateMilestone(projectPath, id, updates) {
  const milestonesFile = path.join(projectPath, '.xtask', 'milestones.yaml');
  const milestones = getMilestones(projectPath);

  const milestone = milestones.find(m => m.id === id);
  if (!milestone) return null;

  const normalizedUpdates = { ...updates };
  if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'goals')) {
    normalizedUpdates.goals = normalizeGoals(normalizedUpdates.goals);
  }

  Object.assign(milestone, normalizedUpdates);
  writeYaml(milestonesFile, { milestones });
  return milestone;
}

export function deleteMilestone(projectPath, id) {
  const milestonesFile = path.join(projectPath, '.xtask', 'milestones.yaml');
  const milestones = getMilestones(projectPath);

  const filtered = milestones.filter(m => m.id !== id);
  writeYaml(milestonesFile, { milestones: filtered });
  return filtered.length < milestones.length;
}
