import fs from 'fs';
import path from 'path';
import { readFile } from './gitDataStore.js';

const XTASK_TODOS_DIR = 'xtask_todos';

// 从本地文件系统读取 xtask_todos/ 文档（任务进行中）
export function readLocalTodoDocs(worktreePath) {
  if (!worktreePath) return null;

  const todosDir = path.join(worktreePath, XTASK_TODOS_DIR);
  if (!fs.existsSync(todosDir)) return null;

  const taskMdPath = path.join(todosDir, 'task.md');
  const analysisMdPath = path.join(todosDir, 'analysis.md');
  const hasTaskMd = fs.existsSync(taskMdPath);
  const hasAnalysisMd = fs.existsSync(analysisMdPath);

  if (!hasTaskMd && !hasAnalysisMd) return null;

  return {
    task_md: hasTaskMd ? fs.readFileSync(taskMdPath, 'utf-8') : null,
    analysis_md: hasAnalysisMd ? fs.readFileSync(analysisMdPath, 'utf-8') : null,
    has_task_md: hasTaskMd,
    has_analysis_md: hasAnalysisMd,
    source: 'local'
  };
}

// 从 xtask 数据分支读取归档文档（任务已完成）
export function readArchivedTodoDocs(projectPath, taskId) {
  const taskMd = readFile(projectPath, `tasks/${taskId}/todo-task.md`);
  const analysisMd = readFile(projectPath, `tasks/${taskId}/todo-analysis.md`);

  if (!taskMd && !analysisMd) return null;

  return {
    task_md: taskMd || null,
    analysis_md: analysisMd || null,
    has_task_md: Boolean(taskMd),
    has_analysis_md: Boolean(analysisMd),
    source: 'archive'
  };
}

// 根据任务状态自动选择数据源
export function getTodoDocs(projectPath, taskId, task, worktreePath) {
  // 已完成的任务从归档读取
  if (task?.status === 'done') {
    return readArchivedTodoDocs(projectPath, taskId) || { task_md: null, analysis_md: null, has_task_md: false, has_analysis_md: false, source: 'archive' };
  }

  // 进行中的任务从本地文件系统读取
  if (worktreePath) {
    const localDocs = readLocalTodoDocs(worktreePath);
    if (localDocs) return localDocs;
  }

  // 兜底：尝试从归档读取
  return readArchivedTodoDocs(projectPath, taskId) || { task_md: null, analysis_md: null, has_task_md: false, has_analysis_md: false, source: 'none' };
}
