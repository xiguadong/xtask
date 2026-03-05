import fs from 'fs';
import path from 'path';
import { ensureDir, writeYaml } from '../utils/yaml.js';

export function initCommand() {
  const projectPath = process.cwd();
  const xtaskDir = path.join(projectPath, '.xtask');
  const tasksDir = path.join(xtaskDir, 'tasks');

  if (fs.existsSync(xtaskDir)) {
    console.log('Project already initialized');
    return;
  }

  ensureDir(tasksDir);
  writeYaml(path.join(xtaskDir, 'config.yaml'), {});
  writeYaml(path.join(xtaskDir, 'milestones.yaml'), { milestones: [] });

  console.log('Initialized .xtask directory');
}
