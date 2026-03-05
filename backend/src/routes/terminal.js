import express from 'express';
import { getProjectByName } from '../services/projectService.js';
import * as terminalService from '../services/terminalService.js';

const router = express.Router();

router.get('/:projectName/terminals/config', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const config = terminalService.getProjectTerminalConfig(project.path);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:projectName/terminals/config', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const config = terminalService.updateProjectTerminalConfig(project.path, req.body || {});
    res.json(config);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:projectName/terminals/overview', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const overview = terminalService.getProjectTerminalOverview(project.path);
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:projectName/tasks/:taskId/terminal/status', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const status = terminalService.getTaskTerminalStatus(project.path, req.params.taskId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:projectName/tasks/:taskId/terminal/output', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const cursor = Number(req.query.cursor || 0);
    const output = terminalService.readTerminalOutput(project.path, req.params.taskId, cursor);
    res.json(output);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:projectName/tasks/:taskId/terminal/start', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const result = terminalService.startTaskTerminalSession(project.path, req.params.taskId, req.body || {});
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:projectName/tasks/:taskId/terminal/input', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const input = req.body?.input ?? '';
    const result = terminalService.sendTerminalInput(project.path, req.params.taskId, input);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:projectName/tasks/:taskId/terminal/resize', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const cols = Number(req.body?.cols);
    const rows = Number(req.body?.rows);
    const resized = terminalService.resizeTaskTerminal(project.path, req.params.taskId, cols, rows);
    if (!resized) {
      return res.status(404).json({ error: 'Terminal session not running' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:projectName/tasks/:taskId/terminal/stop', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const reason = req.body?.reason || 'manual';
    const stopped = terminalService.stopTaskTerminalSession(project.path, req.params.taskId, reason);
    if (!stopped) {
      return res.status(404).json({ error: 'Terminal session not running' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:projectName/tasks/:taskId/terminal/config', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const config = terminalService.updateTaskTerminalConfig(project.path, req.params.taskId, req.body || {});
    res.json(config);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
