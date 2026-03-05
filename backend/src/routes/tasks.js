import express from 'express';
import { getProjectByName } from '../services/projectService.js';
import { getTasks, getTaskById, createTask, updateTask, deleteTask, assignAgent } from '../services/taskService.js';

const router = express.Router();

router.get('/:projectName/tasks', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const tasks = getTasks(project.path, req.query);
  res.json(tasks);
});

router.post('/:projectName/tasks', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const task = createTask(project.path, req.body);
  res.status(201).json(task);
});

router.get('/:projectName/tasks/:id', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const task = getTaskById(project.path, req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  res.json(task);
});

router.put('/:projectName/tasks/:id', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const task = updateTask(project.path, req.params.id, req.body);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  res.json(task);
});

router.delete('/:projectName/tasks/:id', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const deleted = deleteTask(project.path, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Task not found' });

  res.status(204).send();
});

router.put('/:projectName/tasks/:id/assign', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const task = assignAgent(project.path, req.params.id, req.body);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  res.json(task);
});

export default router;
