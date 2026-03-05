import express from 'express';
import { getProjectByName } from '../services/projectService.js';
import * as worktreeService from '../services/worktreeService.js';
import * as branchTaskService from '../services/branchTaskService.js';

const router = express.Router();

router.get('/:projectName/worktrees', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const worktrees = worktreeService.getWorktrees(project.path);
    res.json(worktrees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:projectName/worktrees', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const { branch, worktree_path, agent } = req.body;
    const worktree = worktreeService.createWorktree(project.path, branch, worktree_path, agent);
    res.json(worktree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:projectName/worktrees/:branch', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const worktree = worktreeService.getWorktree(project.path, req.params.branch);
    if (!worktree) return res.status(404).json({ error: 'Worktree not found' });
    res.json(worktree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:projectName/worktrees/:branch', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const worktree = worktreeService.updateWorktree(project.path, req.params.branch, req.body);
    if (!worktree) return res.status(404).json({ error: 'Worktree not found' });
    res.json(worktree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:projectName/worktrees/:branch', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const success = worktreeService.deleteWorktree(project.path, req.params.branch);
    if (!success) return res.status(404).json({ error: 'Worktree not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:projectName/worktrees/:oldBranch/rename', (req, res) => {
  try {
    const project = getProjectByName(req.params.projectName);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const { newBranch } = req.body;
    const worktree = worktreeService.renameWorktree(project.path, req.params.oldBranch, newBranch);
    if (!worktree) return res.status(404).json({ error: 'Worktree not found' });

    branchTaskService.renameBranchTasks(project.path, req.params.oldBranch, newBranch);

    res.json(worktree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
