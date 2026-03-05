const API_BASE = '/api';

export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/projects`);
  return res.json();
}

export async function fetchProject(name: string) {
  const res = await fetch(`${API_BASE}/projects/${name}`);
  return res.json();
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
  return res.json();
}

export async function updateTask(projectName: string, id: string, updates: any) {
  const res = await fetch(`${API_BASE}/projects/${projectName}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return res.json();
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
