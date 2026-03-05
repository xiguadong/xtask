import express from 'express';
import { getProjectByName } from '../services/projectService.js';
import * as branchTaskService from '../services/branchTaskService.js';

const router = express.Router();

router.get('/:projectName/branches/:branch/tasks', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const tasks = branchTaskService.getBranchTasks(project.path, req.params.branch);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:projectName/branches/:branch/tasks', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const task = branchTaskService.createBranchTask(project.path, req.params.branch, req.body);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
