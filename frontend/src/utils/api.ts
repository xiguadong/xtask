const API_BASE = '/api';

export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/projects`);
  return res.json();
}

export async function fetchDiscussions(projectName: string) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/discussions`);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '加载讨论失败');
  }
  return res.json();
}

export async function createDiscussion(projectName: string, payload: any) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/discussions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '创建讨论失败');
  }
  return res.json();
}

export async function updateDiscussion(projectName: string, id: string, payload: any) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/discussions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '更新讨论失败');
  }
  return res.json();
}

export async function addDiscussionComment(projectName: string, id: string, payload: any) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/discussions/${id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '添加评论失败');
  }
  return res.json();
}

export async function fetchProject(name: string) {
  const res = await fetch(`${API_BASE}/projects/${name}`);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '加载项目失败');
  }
  return res.json();
}

export async function deleteProject(name: string) {
  const res = await fetch(`${API_BASE}/projects/${name}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '删除项目失败');
  }
}

export async function fetchTasks(projectName: string, filters?: Record<string, string>) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${API_BASE}/projects/${projectName}/tasks?${params}`);
  return res.json();
}

export async function fetchTask(projectName: string, id: string) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/tasks/${id}`);
  return res.json();
}

export async function createTask(projectName: string, task: any) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '创建任务失败');
  }
  return res.json();
}

export async function updateTask(projectName: string, id: string, updates: any) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '更新任务失败');
  }
  return res.json();
}

export async function deleteTask(projectName: string, id: string) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/tasks/${id}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '删除任务失败');
  }
}

export async function assignAgent(projectName: string, id: string, agentInfo: any) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/tasks/${id}/assign`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agentInfo)
  });
  return res.json();
}

export async function fetchMilestones(projectName: string) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/milestones`);
  return res.json();
}

export async function createMilestone(projectName: string, milestone: any) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/milestones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(milestone)
  });
  return res.json();
}

export async function updateMilestone(projectName: string, id: string, updates: any) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/milestones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return res.json();
}

export async function deleteMilestone(projectName: string, id: string) {
  await fetch(`${API_BASE}/projects/${projectName}/milestones/${id}`, {
    method: 'DELETE'
  });
}

export async function fetchTerminalOverview(projectName: string) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/terminals/overview`);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '加载终端概览失败');
  }
  return res.json();
}

export async function fetchTerminalConfig(projectName: string) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/terminals/config`);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '加载终端配置失败');
  }
  return res.json();
}

export async function updateTerminalConfig(projectName: string, payload: any) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/terminals/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '更新终端配置失败');
  }
  return res.json();
}

export async function fetchTaskTerminalStatus(projectName: string, taskId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/tasks/${taskId}/terminal/status`);
  return res.json();
}

export async function fetchTaskTerminalOutput(projectName: string, taskId: string, cursor: number) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/tasks/${taskId}/terminal/output?cursor=${cursor}`);
  return res.json();
}

export async function startTaskTerminal(projectName: string, taskId: string, payload: any) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/tasks/${taskId}/terminal/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '启动终端失败');
  }
  return res.json();
}

export async function stopTaskTerminal(projectName: string, taskId: string, reason = 'manual') {
  const res = await fetch(`${API_BASE}/projects/${projectName}/tasks/${taskId}/terminal/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '停止终端失败');
  }
  return res.json();
}

export async function sendTaskTerminalInput(projectName: string, taskId: string, input: string) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/tasks/${taskId}/terminal/input`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '发送命令失败');
  }
  return res.json();
}

export async function resizeTaskTerminal(projectName: string, taskId: string, cols: number, rows: number) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/tasks/${taskId}/terminal/resize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cols, rows })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '调整终端尺寸失败');
  }
  return res.json();
}

export async function updateTaskTerminalConfig(projectName: string, taskId: string, payload: any) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/tasks/${taskId}/terminal/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '更新终端配置失败');
  }
  return res.json();
}

export interface TodoDocsResponse {
  task_md: string | null;
  analysis_md: string | null;
  has_task_md: boolean;
  has_analysis_md: boolean;
  source: 'local' | 'archive' | 'none';
}

export async function fetchTodoDocs(projectName: string, taskId: string, branch?: string): Promise<TodoDocsResponse> {
  const params = branch ? `?branch=${encodeURIComponent(branch)}` : '';
  const res = await fetch(`${API_BASE}/projects/${projectName}/tasks/${taskId}/todo-docs${params}`);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || '加载 Todo 文档失败');
  }
  return res.json();
}
