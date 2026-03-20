import fs from 'fs';
import path from 'path';

const TASK_MD_TEMPLATE = `# [任务标题]

**Status:** Refining

## Original Todo

[来自任务描述的原始文本]

## Description

[我们正在构建什么]

_阅读 [analysis.md](./analysis.md) 以获取详细的代码库调研和上下文_

## Implementation Plan

[我们将如何构建它]

- [ ] 代码变更及位置
- [ ] 自动化测试
- [ ] 用户测试

## Notes

[实现笔记]
`;

const ANALYSIS_MD_TEMPLATE = `# 代码分析

## 需求分析

[需求理解和拆解]

## 代码库调研

[相关文件、函数、模式的调研结果]

## 影响范围

[变更涉及的文件和模块]

## 数据流设计

[数据流转和接口设计]
`;

const XTASK_TODOS_DIR = 'xtask_todos';

// 初始化 xtask_todos/ 目录，在 worktree 创建时调用
export function initXtaskTodos(worktreePath, projectRoot) {
  const todosDir = path.join(worktreePath, XTASK_TODOS_DIR);

  if (fs.existsSync(todosDir)) {
    return;
  }

  fs.mkdirSync(todosDir, { recursive: true });
  fs.writeFileSync(path.join(todosDir, 'task.md'), TASK_MD_TEMPLATE, 'utf-8');
  fs.writeFileSync(path.join(todosDir, 'analysis.md'), ANALYSIS_MD_TEMPLATE, 'utf-8');

  // 尝试从 main/master 分支拷贝 project-description.md
  tryDeliverProjectDescription(worktreePath, projectRoot);
}

// 从主分支拷贝 project-description.md 到 xtask_todos/
function tryDeliverProjectDescription(worktreePath, projectRoot) {
  const candidates = [
    path.join(projectRoot, 'todos', 'project-description.md'),
    path.join(projectRoot, 'todos', 'project_description.md')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const dest = path.join(worktreePath, XTASK_TODOS_DIR, 'project-description.md');
      fs.copyFileSync(candidate, dest);
      return;
    }
  }
}

// 读取 xtask_todos/ 中的文档内容
export function readXtaskTodoDocs(worktreePath) {
  const todosDir = path.join(worktreePath, XTASK_TODOS_DIR);
  if (!fs.existsSync(todosDir)) {
    return null;
  }

  const taskMdPath = path.join(todosDir, 'task.md');
  const analysisMdPath = path.join(todosDir, 'analysis.md');

  return {
    task_md: fs.existsSync(taskMdPath) ? fs.readFileSync(taskMdPath, 'utf-8') : null,
    analysis_md: fs.existsSync(analysisMdPath) ? fs.readFileSync(analysisMdPath, 'utf-8') : null,
    has_task_md: fs.existsSync(taskMdPath),
    has_analysis_md: fs.existsSync(analysisMdPath)
  };
}

// 归档 xtask_todos/ 文档到 xtask 数据分支，并删除本地目录
export function archiveXtaskTodoDocs(worktreePath, taskId, writeFilesFn, projectRoot) {
  const docs = readXtaskTodoDocs(worktreePath);
  if (!docs) return [];

  const changes = [];

  if (docs.task_md) {
    changes.push({
      path: `tasks/${taskId}/todo-task.md`,
      content: docs.task_md
    });
  }

  if (docs.analysis_md) {
    changes.push({
      path: `tasks/${taskId}/todo-analysis.md`,
      content: docs.analysis_md
    });
  }

  // 写入 xtask 数据分支
  if (changes.length > 0 && writeFilesFn) {
    writeFilesFn(projectRoot, changes, 'xtask archive todo docs');
  }

  // 删除本地 xtask_todos/ 目录
  const todosDir = path.join(worktreePath, XTASK_TODOS_DIR);
  if (fs.existsSync(todosDir)) {
    fs.rmSync(todosDir, { recursive: true, force: true });
  }

  return changes;
}

// 检查 xtask_todos/ 是否存在
export function hasXtaskTodos(worktreePath) {
  const todosDir = path.join(worktreePath, XTASK_TODOS_DIR);
  return fs.existsSync(todosDir);
}
