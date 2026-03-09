import express from 'express';
import { getProjectByName } from '../services/projectService.js';
import { getTasks, getTaskById, createTask, updateTask, deleteTask, assignAgent, getTaskDescription } from '../services/taskService.js';
import * as branchTaskService from '../services/branchTaskService.js';
import * as terminalService from '../services/terminalService.js';
import { isTaskDone } from '../utils/taskStatus.js';

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

  const previousTask = getTaskById(project.path, req.params.id);
  const task = updateTask(project.path, req.params.id, req.body);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const becameCompleted =
    previousTask &&
    !isTaskDone(previousTask.status) &&
    isTaskDone(task.status);

  if (becameCompleted && task.terminal?.auto_stop_on_task_done) {
    terminalService.stopTaskTerminalSession(project.path, req.params.id, 'task_completed');
  }

  res.json(task);
});

router.delete('/:projectName/tasks/:id', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  terminalService.stopTaskTerminalSession(project.path, req.params.id, 'task_deleted');
  const deleted = deleteTask(project.path, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Task not found' });

  res.status(204).send();
});

router.put('/:projectName/tasks/:id/assign', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const task = assignAgent(project.path, req.params.id, req.body);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (req.body.branch) {
    branchTaskService.assignTaskToBranch(project.path, req.params.id, req.body.branch);
  }

  res.json(task);
});

router.post('/:projectName/tasks/:id/merge', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { from_branch } = req.body;
  const task = branchTaskService.mergeTaskToMain(project.path, from_branch, req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  res.json(task);
});

router.get('/:projectName/tasks/:id/description', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const description = getTaskDescription(project.path, req.params.id);
  if (!description) return res.status(404).json({ error: 'Description not found' });

  res.json({ content: description });
});

export default router;
