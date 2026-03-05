import express from 'express';
import { getAllProjects, getProjectByName } from '../services/projectService.js';
import { getTasks } from '../services/taskService.js';
import { getMilestones } from '../services/milestoneService.js';

const router = express.Router();

router.get('/', (req, res) => {
  const projects = getAllProjects();
  const enriched = projects.map(p => {
    const tasks = getTasks(p.path);
    const milestones = getMilestones(p.path);
    return {
      ...p,
      taskCount: tasks.length,
      milestoneCount: milestones.length
    };
  });
  res.json(enriched);
});

router.get('/:name', (req, res) => {
  const project = getProjectByName(req.params.name);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

export default router;
