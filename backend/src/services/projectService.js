import os from 'os';
import path from 'path';
import { readYaml } from '../utils/yamlHelper.js';

const GLOBAL_DIR = path.join(os.homedir(), '.xtask');
const PROJECTS_FILE = path.join(GLOBAL_DIR, 'projects.yaml');

export function getAllProjects() {
  const data = readYaml(PROJECTS_FILE);
  if (!data) return [];
  return data.projects.filter(p => !p.hidden);
}

export function getProjectByName(name) {
  const projects = getAllProjects();
  return projects.find(p => p.name === name);
}
