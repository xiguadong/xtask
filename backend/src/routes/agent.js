import express from 'express';
import { getProjectByName } from '../services/projectService.js';
import * as agentService from '../services/agentService.js';

const router = express.Router();

router.post('/:projectName/tasks/:taskId/agent/start', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { branch } = req.body;
    const result = agentService.startAgent(project.path, req.params.taskId, branch);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:projectName/tasks/:taskId/agent/status', (req, res) => {
  try {
    const status = agentService.getAgentStatus(req.params.taskId);
    if (!status) return res.status(404).json({ error: 'Agent not running' });
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:projectName/tasks/:taskId/agent/stop', (req, res) => {
  try {
    const stopped = agentService.stopAgent(req.params.taskId);
    if (!stopped) return res.status(404).json({ error: 'Agent not running' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
