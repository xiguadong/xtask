import fs from 'fs';
import path from 'path';
import { readYaml, writeYaml } from '../utils/yaml.js';

export function createMilestone(name, options = {}) {
  const projectPath = process.cwd();
  const milestonesFile = path.join(projectPath, '.xtask', 'milestones.yaml');

  if (!fs.existsSync(milestonesFile)) {
    console.log('Error: Not in an xtask project');
    return;
  }

  const data = readYaml(milestonesFile);
  const milestones = data.milestones || [];

  const id = `m${milestones.length + 1}`;
  milestones.push({
    id,
    name,
    description: options.description || '',
    due_date: options.due || null,
    status: 'active'
  });

  writeYaml(milestonesFile, { milestones });
  console.log(`Created milestone: ${id} - ${name}`);
}

export function listMilestones() {
  const projectPath = process.cwd();
  const milestonesFile = path.join(projectPath, '.xtask', 'milestones.yaml');

  if (!fs.existsSync(milestonesFile)) {
    console.log('Error: Not in an xtask project');
    return;
  }

  const data = readYaml(milestonesFile);
  const milestones = data.milestones || [];

  if (milestones.length === 0) {
    console.log('No milestones');
    return;
  }

  milestones.forEach(m => {
    console.log(`${m.id}: ${m.name} [${m.status}]${m.due_date ? ` - Due: ${m.due_date}` : ''}`);
  });
}

export function updateMilestone(id, options = {}) {
  const projectPath = process.cwd();
  const milestonesFile = path.join(projectPath, '.xtask', 'milestones.yaml');

  if (!fs.existsSync(milestonesFile)) {
    console.log('Error: Not in an xtask project');
    return;
  }

  const data = readYaml(milestonesFile);
  const milestone = data.milestones.find(m => m.id === id);

  if (!milestone) {
    console.log('Milestone not found');
    return;
  }

  if (options.name) milestone.name = options.name;
  if (options.status) milestone.status = options.status;
  if (options.due) milestone.due_date = options.due;

  writeYaml(milestonesFile, data);
  console.log(`Updated milestone: ${id}`);
}
