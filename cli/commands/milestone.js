import yaml from 'js-yaml';
import { getRepoRoot } from '../utils/gitRepo.js';
import { readYaml as readGitYaml, writeFiles } from '../utils/gitDataStore.js';

export function createMilestone(name, options = {}) {
  const projectPath = getRepoRoot();
  const data = readGitYaml(projectPath, 'milestones.yaml') || { milestones: [] };
  const milestones = data.milestones || [];

  const id = `m${milestones.length + 1}`;
  milestones.push({
    id,
    name,
    description: options.description || '',
    due_date: options.due || null,
    status: 'active'
  });

  writeFiles(projectPath, [
    { path: 'milestones.yaml', content: yaml.dump({ milestones }) }
  ], 'xtask create milestone');
  console.log(`Created milestone: ${id} - ${name}`);
}

export function listMilestones() {
  const projectPath = getRepoRoot();
  const data = readGitYaml(projectPath, 'milestones.yaml');
  const milestones = data?.milestones || [];

  if (milestones.length === 0) {
    console.log('No milestones');
    return;
  }

  milestones.forEach(m => {
    console.log(`${m.id}: ${m.name} [${m.status}]${m.due_date ? ` - Due: ${m.due_date}` : ''}`);
  });
}

export function updateMilestone(id, options = {}) {
  const projectPath = getRepoRoot();
  const data = readGitYaml(projectPath, 'milestones.yaml') || { milestones: [] };
  const milestone = data.milestones.find(m => m.id === id);

  if (!milestone) {
    console.log('Milestone not found');
    return;
  }

  if (options.name) milestone.name = options.name;
  if (options.status) milestone.status = options.status;
  if (options.due) milestone.due_date = options.due;

  writeFiles(projectPath, [
    { path: 'milestones.yaml', content: yaml.dump(data) }
  ], 'xtask update milestone');
  console.log(`Updated milestone: ${id}`);
}
