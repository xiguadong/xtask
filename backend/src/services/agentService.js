import { spawn } from 'child_process';
import yaml from 'js-yaml';
import { readYaml, writeFiles } from '../utils/gitDataStore.js';
import { normalizeTaskStatus } from '../utils/taskStatus.js';
import { getTaskSummaryFilePath, readTaskDescriptionContent } from '../utils/taskContent.js';
import { buildDoneStatusSyncChanges } from './branchTaskService.js';

const runningAgents = new Map();

export function startAgent(projectPath, taskId, branch = null) {
  const taskPath = branch
    ? `branches/${branch}/${taskId}.yaml`
    : `tasks/${taskId}/task.yaml`;

  const task = readYaml(projectPath, taskPath);
  if (!task) {
    runningAgents.delete(taskId);
    return;
  }

  if (runningAgents.has(taskId)) {
    throw new Error('Agent already running for this task');
  }

  const env = { ...process.env, CLAUDE_BYPASS_PERMISSIONS: '1' };
  delete env.CLAUDECODE;

  const agentPrompt = readTaskDescriptionContent(projectPath, task) || task.title;
  const agentProcess = spawn('claude', [
    '--dangerously-skip-permissions',
    '--permission-mode', 'bypassPermissions',
    'chat',
    agentPrompt
  ], {
    cwd: projectPath,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const sessionId = `${taskId}-${Date.now()}`;

  const agentData = {
    taskId,
    branch,
    sessionId,
    process: agentProcess,
    output: [],
    status: 'running',
    startedAt: new Date().toISOString()
  };

  runningAgents.set(taskId, agentData);

  agentProcess.stdout.on('data', (data) => {
    agentData.output.push(data.toString());
  });

  agentProcess.stderr.on('data', (data) => {
    agentData.output.push(`[ERROR] ${data.toString()}`);
  });

  agentProcess.on('close', (code) => {
    agentData.status = code === 0 ? 'completed' : 'failed';
    agentData.exitCode = code;
    agentData.completedAt = new Date().toISOString();

    updateTaskWithAgentResult(projectPath, taskId, branch, agentData);
  });

  task.agent.assigned = true;
  task.agent.status = 'running';
  task.agent.assigned_at = agentData.startedAt;
  task.agent.session_id = sessionId;
  task.updated_at = new Date().toISOString();
  writeFiles(projectPath, [
    { path: taskPath, content: yaml.dump(task) }
  ], 'xtask agent start');

  return {
    taskId,
    sessionId,
    status: 'running',
    startedAt: agentData.startedAt
  };
}

function updateTaskWithAgentResult(projectPath, taskId, branch, agentData) {
  const taskPath = branch
    ? `branches/${branch}/${taskId}.yaml`
    : `tasks/${taskId}/task.yaml`;

  const task = readYaml(projectPath, taskPath);

  task.agent.status = agentData.status;
  task.status = agentData.status === 'completed' ? 'done' : normalizeTaskStatus(task.status, 'in_progress');
  task.updated_at = new Date().toISOString();

  const output = agentData.output.join('\n');
  const summarizedOutput = output.length > 4000 ? `${output.slice(0, 4000)}\n\n...（以下内容已截断）` : output;
  const content = `# ${task.title}\n\n## 执行总结\n\n- 状态：${agentData.status}\n- 开始时间：${agentData.startedAt}\n- 完成时间：${agentData.completedAt}\n- 退出码：${agentData.exitCode}\n\n## 输出摘要\n\n\`\`\`\n${summarizedOutput}\n\`\`\`\n`;

  task.summary_file = getTaskSummaryFilePath(taskId);
  const syncChanges = branch ? buildDoneStatusSyncChanges(projectPath, task, task.updated_at) : [];

  writeFiles(projectPath, [
    { path: task.summary_file, content },
    { path: taskPath, content: yaml.dump(task) },
    ...syncChanges
  ], 'xtask agent complete');
  runningAgents.delete(taskId);
}

export function getAgentStatus(taskId) {
  const agentData = runningAgents.get(taskId);
  if (!agentData) return null;

  return {
    taskId: agentData.taskId,
    sessionId: agentData.sessionId,
    status: agentData.status,
    startedAt: agentData.startedAt,
    output: agentData.output
  };
}

export function stopAgent(taskId) {
  const agentData = runningAgents.get(taskId);
  if (!agentData) return false;

  agentData.process.kill();
  runningAgents.delete(taskId);
  return true;
}
