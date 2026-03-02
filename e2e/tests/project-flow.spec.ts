import { expect, test, type APIRequestContext } from '@playwright/test';

async function getProjectId(request: APIRequestContext): Promise<string> {
  const response = await request.get('http://127.0.0.1:8080/api/projects');
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { projects: Array<{ id: string }> };
  expect(payload.projects.length).toBeGreaterThan(0);
  return payload.projects[0].id;
}

async function createTask(request: APIRequestContext, projectId: string, title: string): Promise<string> {
  const response = await request.post(`http://127.0.0.1:8080/api/projects/${projectId}/tasks`, {
    data: { title, priority: 'high' },
  });
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { id: string };
  return payload.id;
}

async function createMilestone(request: APIRequestContext, projectId: string, title: string): Promise<string> {
  const response = await request.post(`http://127.0.0.1:8080/api/projects/${projectId}/milestones`, {
    data: { title, due_date: '2026-03-15' },
  });
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { id: string };
  return payload.id;
}

test('home to project flow and create task', async ({ page }) => {
  const taskTitle = `e2e-ui-${Date.now()}`;

  await page.goto('/');
  await expect(page.getByTestId('home-overview-board')).toBeVisible();
  await expect(page.getByTestId('home-status-lanes')).toBeVisible();

  await page.getByTestId('home-project-card').first().click();
  await expect(page).toHaveURL(/\/project\//);
  await expect(page.getByTestId('project-task-board')).toBeVisible();

  await page.getByTestId('new-task-button').click();
  await page.getByLabel('Title').fill(taskTitle);
  await page.getByRole('button', { name: 'Create Task' }).click();

  await expect(page.getByTestId('project-task-card').filter({ hasText: taskTitle }).first()).toBeVisible();
});

test('board and list view are consistent', async ({ page, request }) => {
  const projectId = await getProjectId(request);
  await createTask(request, projectId, `e2e-view-${Date.now()}`);

  await page.goto(`/project/${projectId}`);
  await expect(page.getByTestId('project-task-board')).toBeVisible();

  const boardCount = await page.getByTestId('project-task-card').count();
  await page.getByRole('button', { name: 'List' }).click();
  await expect(page.getByTestId('project-task-list')).toBeVisible();

  const rowCount = await page.locator('[data-testid="project-task-list"] tbody tr').count();
  expect(rowCount).toBe(boardCount);
});

test('plan and feature view render expected sections', async ({ page, request }) => {
  const projectId = await getProjectId(request);
  const timestamp = Date.now();
  const milestoneId = await createMilestone(request, projectId, `M-${timestamp}`);

  const parentRes = await request.post(`http://127.0.0.1:8080/api/projects/${projectId}/tasks`, {
    data: {
      title: `e2e-plan-parent-${timestamp}`,
      milestone_id: milestoneId,
      labels: ['feature:auth'],
      priority: 'high',
    },
  });
  expect(parentRes.ok()).toBeTruthy();
  const parent = (await parentRes.json()) as { id: string; title: string };

  const childRes = await request.post(`http://127.0.0.1:8080/api/projects/${projectId}/tasks`, {
    data: {
      title: `e2e-plan-child-${timestamp}`,
      milestone_id: milestoneId,
      labels: ['feature:auth', 'feature:billing'],
      priority: 'medium',
    },
  });
  expect(childRes.ok()).toBeTruthy();
  const child = (await childRes.json()) as { id: string; title: string };

  const unassignedRes = await request.post(`http://127.0.0.1:8080/api/projects/${projectId}/tasks`, {
    data: {
      title: `e2e-unassigned-${timestamp}`,
      priority: 'low',
    },
  });
  expect(unassignedRes.ok()).toBeTruthy();
  const unassigned = (await unassignedRes.json()) as { id: string; title: string };

  const relationRes = await request.post(`http://127.0.0.1:8080/api/projects/${projectId}/relations`, {
    data: { type: 'parent_child', source_id: parent.id, target_id: child.id },
  });
  expect(relationRes.status()).toBe(201);

  await page.goto(`/project/${projectId}`);
  await page.getByRole('button', { name: 'Plan' }).click();
  await expect(page.getByTestId('project-task-plan')).toBeVisible();
  await expect(page.getByTestId('plan-section').filter({ hasText: 'Backlog / Unplanned' })).toBeVisible();
  await expect(page.getByTestId('plan-task-row').filter({ hasText: parent.title })).toBeVisible();
  await expect(page.getByTestId('plan-task-row').filter({ hasText: child.title })).toBeVisible();
  await expect(page.getByText(unassigned.title)).toBeVisible();

  await page.getByRole('button', { name: 'Feature' }).click();
  await expect(page.getByTestId('project-task-feature')).toBeVisible();
  await expect(page.getByTestId('feature-group').filter({ hasText: 'auth' })).toBeVisible();
  await expect(page.getByTestId('feature-group').filter({ hasText: 'billing' })).toBeVisible();
  await expect(page.getByTestId('feature-group').filter({ hasText: 'Unassigned' })).toBeVisible();
});

test('api blocks done transition when blocked and rejects cycle', async ({ request }) => {
  const projectId = await getProjectId(request);
  const blockerID = await createTask(request, projectId, `e2e-blocker-${Date.now()}`);
  const targetID = await createTask(request, projectId, `e2e-target-${Date.now()}`);

  const relRes = await request.post(`http://127.0.0.1:8080/api/projects/${projectId}/relations`, {
    data: {
      type: 'blocks',
      source_id: blockerID,
      target_id: targetID,
    },
  });
  expect(relRes.status()).toBe(201);

  const blockedDone = await request.put(`http://127.0.0.1:8080/api/projects/${projectId}/tasks/${targetID}`, {
    data: { status: 'done' },
  });
  expect(blockedDone.status()).toBe(409);
  const blockedPayload = (await blockedDone.json()) as { error: { code: string } };
  expect(blockedPayload.error.code).toBe('BLOCKED_CONSTRAINT');

  const finishBlocker = await request.put(`http://127.0.0.1:8080/api/projects/${projectId}/tasks/${blockerID}`, {
    data: { status: 'done' },
  });
  expect(finishBlocker.status()).toBe(200);

  const doneNow = await request.put(`http://127.0.0.1:8080/api/projects/${projectId}/tasks/${targetID}`, {
    data: { status: 'done' },
  });
  expect(doneNow.status()).toBe(200);

  const a = await createTask(request, projectId, `e2e-cycle-a-${Date.now()}`);
  const b = await createTask(request, projectId, `e2e-cycle-b-${Date.now()}`);
  const c = await createTask(request, projectId, `e2e-cycle-c-${Date.now()}`);

  expect(
    (
      await request.post(`http://127.0.0.1:8080/api/projects/${projectId}/relations`, {
        data: { type: 'blocks', source_id: a, target_id: b },
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await request.post(`http://127.0.0.1:8080/api/projects/${projectId}/relations`, {
        data: { type: 'blocks', source_id: b, target_id: c },
      })
    ).status(),
  ).toBe(201);

  const cycle = await request.post(`http://127.0.0.1:8080/api/projects/${projectId}/relations`, {
    data: { type: 'blocks', source_id: c, target_id: a },
  });
  expect(cycle.status()).toBe(422);
  const cyclePayload = (await cycle.json()) as { error: { code: string } };
  expect(cyclePayload.error.code).toBe('CYCLE_DETECTED');
});
