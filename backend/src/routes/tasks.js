import express from 'express';
import path from 'path';
import { getProjectByName } from '../services/projectService.js';
import { getTasks, getTaskById, createTask, updateTask, deleteTask, assignAgent, getTaskDescription } from '../services/taskService.js';
import * as branchTaskService from '../services/branchTaskService.js';
import * as terminalService from '../services/terminalService.js';
import { isTaskDone } from '../utils/taskStatus.js';
import { getTodoDocs } from '../utils/xtaskTodos.js';
import { getWorktree } from '../services/worktreeService.js';

const router = express.Router();

function resolveTaskVariant(projectPath, taskId, branchHint = null) {
  const mainTask = getTaskById(projectPath, taskId);
  const branch = branchHint || mainTask?.git?.branch || null;
  const branchTask = branch
    ? branchTaskService.getBranchTaskById(projectPath, branch, taskId, {
      includeDescriptionContent: true,
      includeSummaryContent: true
    })
    : null;

  return {
    mainTask,
    branch,
    task: branchTask || mainTask,
    isBranchTask: Boolean(branchTask)
  };
}

router.get('/:projectName/tasks', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const tasks = getTasks(project.path, req.query);
  res.json(tasks);
});

router.post('/:projectName/tasks', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  try {
    const task = createTask(project.path, req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message || '创建任务失败' });
  }
});

router.get('/:projectName/tasks/:id', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { task } = resolveTaskVariant(project.path, req.params.id, req.query.branch);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  res.json(task);
});

router.put('/:projectName/tasks/:id', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const resolved = resolveTaskVariant(project.path, req.params.id, req.query.branch || req.body?.git?.branch);
  const previousTask = resolved.task;

  let task = null;
  if (resolved.isBranchTask && resolved.branch) {
    task = branchTaskService.updateBranchTask(project.path, resolved.branch, req.params.id, req.body);
  } else {
    task = updateTask(project.path, req.params.id, req.body);
    if (task?.git?.branch) {
      branchTaskService.assignTaskToBranch(project.path, req.params.id, task.git.branch, {
        sourceBranch: task.git.source_branch ?? null
      });
    }
  }

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

  const resolved = resolveTaskVariant(project.path, req.params.id, req.query.branch);
  if (resolved.isBranchTask && resolved.task) {
    return res.json({ content: resolved.task.description_content || resolved.task.description || '' });
  }

  const description = getTaskDescription(project.path, req.params.id);
  if (!description) return res.status(404).json({ error: 'Description not found' });

  res.json({ content: description });
});

// 获取任务的 todo 文档 (task.md / analysis.md)
router.get('/:projectName/tasks/:id/todo-docs', (req, res) => {
  const project = getProjectByName(req.params.projectName);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { task, branch } = resolveTaskVariant(project.path, req.params.id, req.query.branch);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  // 获取 worktree 路径
  let worktreePath = null;
  if (branch) {
    const worktree = getWorktree(project.path, branch);
    if (worktree?.worktree_path) {
      worktreePath = path.isAbsolute(worktree.worktree_path)
        ? worktree.worktree_path
        : path.resolve(project.path, worktree.worktree_path);
    }
  }

  const docs = getTodoDocs(project.path, req.params.id, task, worktreePath);
  res.json(docs);
});

export default router;
