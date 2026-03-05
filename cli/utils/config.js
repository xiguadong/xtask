import os from 'os';
import path from 'path';
import { readYaml, writeYaml, ensureDir } from './yaml.js';

const GLOBAL_DIR = path.join(os.homedir(), '.xtask');
const PROJECTS_FILE = path.join(GLOBAL_DIR, 'projects.yaml');
const CONFIG_FILE = path.join(GLOBAL_DIR, 'config.yaml');

export function getGlobalDir() {
  return GLOBAL_DIR;
}

export function ensureGlobalDir() {
  ensureDir(GLOBAL_DIR);
  if (!readYaml(PROJECTS_FILE)) {
    writeYaml(PROJECTS_FILE, { projects: [] });
  }
  if (!readYaml(CONFIG_FILE)) {
    writeYaml(CONFIG_FILE, { port: 3000 });
  }
}

export function getProjects() {
  ensureGlobalDir();
  const data = readYaml(PROJECTS_FILE);
  return data?.projects || [];
}

export function saveProjects(projects) {
  ensureGlobalDir();
  writeYaml(PROJECTS_FILE, { projects });
}

export function getConfig() {
  ensureGlobalDir();
  return readYaml(CONFIG_FILE) || { port: 3000 };
}
