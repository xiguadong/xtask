import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { readYaml, writeYaml } from '../utils/yamlHelper.js';
import { fileExists } from '../utils/fileSystem.js';

const runningAgents = new Map();

export function startAgent(projectPath, taskId, branch = null) {
  const taskFile = branch
    ? path.join(projectPath, '.xtask', 'branches', branch, `${taskId}.yaml`)
    : path.join(projectPath, '.xtask', 'tasks', taskId, 'task.yaml');

  if (!fileExists(taskFile)) {
    throw new Error('Task not found');
  }

  const task = readYaml(taskFile);

  if (runningAgents.has(taskId)) {
    throw new Error('Agent already running for this task');
  }

  const env = { ...process.env, CLAUDE_BYPASS_PERMISSIONS: '1' };
  delete env.CLAUDECODE; // 避免嵌套 session 冲突

  const agentProcess = spawn('claude', [
    '--dangerously-skip-permissions',
    '--permission-mode', 'bypassPermissions',
    'chat',
    task.description || task.title
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
  writeYaml(taskFile, task);

  return {
    taskId,
    sessionId,
    status: 'running',
    startedAt: agentData.startedAt
  };
}

function updateTaskWithAgentResult(projectPath, taskId, branch, agentData) {
  const taskFile = branch
    ? path.join(projectPath, '.xtask', 'branches', branch, `${taskId}.yaml`)
    : path.join(projectPath, '.xtask', 'tasks', taskId, 'task.yaml');

  const task = readYaml(taskFile);

  task.agent.status = agentData.status;
  task.status = agentData.status === 'completed' ? 'completed' : 'in_progress';
  task.updated_at = new Date().toISOString();

  const descFile = path.join(projectPath, '.xtask', 'tasks', taskId, 'description.md');
  const output = agentData.output.join('\n');
  const content = `# ${task.title}\n\n## Agent 执行结果\n\n**状态**: ${agentData.status}\n**开始时间**: ${agentData.startedAt}\n**完成时间**: ${agentData.completedAt}\n**退出码**: ${agentData.exitCode}\n\n## 输出\n\n\`\`\`\n${output}\n\`\`\`\n`;

  fs.mkdirSync(path.dirname(descFile), { recursive: true });
  fs.writeFileSync(descFile, content);
  task.description_file = `tasks/${taskId}/description.md`;

  writeYaml(taskFile, task);
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
