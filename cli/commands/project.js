import path from 'path';
import fs from 'fs';
import { getProjects, saveProjects } from '../utils/config.js';

export function registerProject() {
  const projectPath = process.cwd();
  const absPath = path.resolve(projectPath);
  const name = path.basename(absPath);

  if (!fs.existsSync(path.join(absPath, '.xtask'))) {
    console.log('Error: Not an xtask project. Run "xtask init" first.');
    return;
  }

  const projects = getProjects();
  if (projects.find(p => p.path === absPath)) {
    console.log('Project already registered');
    return;
  }

  projects.push({
    name,
    path: absPath,
    created_at: new Date().toISOString(),
    hidden: false
  });

  saveProjects(projects);
  console.log(`Registered project: ${name}`);
}

export function listProjects() {
  const projects = getProjects().filter(p => !p.hidden);
  if (projects.length === 0) {
    console.log('No projects registered');
    return;
  }

  projects.forEach(p => {
    console.log(`${p.name} - ${p.path}`);
  });
}

export function deleteProject(name) {
  const projects = getProjects();
  const project = projects.find(p => p.name === name);

  if (!project) {
    console.log('Project not found');
    return;
  }

  project.hidden = true;
  saveProjects(projects);
  console.log(`Deleted project: ${name}`);
}
