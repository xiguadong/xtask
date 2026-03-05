import express from 'express';
import { getProjectByName } from '../services/projectService.js';
import { getMilestones, createMilestone, updateMilestone, deleteMilestone } from '../services/milestoneService.js';

const router = express.Router();

router.get('/:projectName/milestones', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const milestones = getMilestones(project.path);
  res.json(milestones);
});

router.post('/:projectName/milestones', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const milestone = createMilestone(project.path, req.body);
  res.status(201).json(milestone);
});

router.put('/:projectName/milestones/:id', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const milestone = updateMilestone(project.path, req.params.id, req.body);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

  res.json(milestone);
});

router.delete('/:projectName/milestones/:id', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const deleted = deleteMilestone(project.path, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Milestone not found' });

  res.status(204).send();
});

export default router;
