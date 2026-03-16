import express from 'express';
import { getProjectByName } from '../services/projectService.js';
import { addDiscussionComment, createDiscussion, getDiscussionById, getDiscussions, updateDiscussion } from '../services/discussionService.js';

const router = express.Router();

router.get('/:projectName/discussions', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  res.json(getDiscussions(project.path));
});

router.post('/:projectName/discussions', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const discussion = createDiscussion(project.path, req.body);
  res.status(201).json(discussion);
});

router.get('/:projectName/discussions/:id', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const discussion = getDiscussionById(project.path, req.params.id);
  if (!discussion) return res.status(404).json({ error: 'Discussion not found' });

  res.json(discussion);
});

router.put('/:projectName/discussions/:id', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const discussion = updateDiscussion(project.path, req.params.id, req.body);
  if (!discussion) return res.status(404).json({ error: 'Discussion not found' });

  res.json(discussion);
});

router.post('/:projectName/discussions/:id/comments', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  try {
    const discussion = addDiscussionComment(project.path, req.params.id, req.body);
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' });

    return res.status(201).json(discussion);
  } catch (error) {
    return res.status(400).json({ error: error.message || '添加评论失败' });
  }
});

export default router;
