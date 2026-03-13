import os from 'os';
import path from 'path';
import { readYaml, writeYaml } from '../utils/yamlHelper.js';
import { detectDefaultBranch } from '../utils/gitRepo.js';

const GLOBAL_DIR = path.join(os.homedir(), '.xtask');
const PROJECTS_FILE = path.join(GLOBAL_DIR, 'projects.yaml');

function readProjectsConfig() {
  const data = readYaml(PROJECTS_FILE);
  if (!data || !Array.isArray(data.projects)) {
    return { projects: [] };
  }
  return data;
}

export function getAllProjects(options = {}) {
  const data = readProjectsConfig();
  if (options.includeHidden) {
    return data.projects;
  }
  return data.projects.filter(p => !p.hidden);
}

export function getProjectByName(name, options = {}) {
  const projects = getAllProjects(options);
  return projects.find(p => p.name === name);
}

export function getProjectDefaultBranch(projectPath) {
  return detectDefaultBranch(projectPath);
}

export function hideProjectByName(name) {
  const data = readProjectsConfig();
  const project = data.projects.find((item) => item.name === name && !item.hidden);
  if (!project) return null;

  project.hidden = true;
  writeYaml(PROJECTS_FILE, data);

  return project;
}
