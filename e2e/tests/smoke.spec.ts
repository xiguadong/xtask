import { expect, test } from '@playwright/test';

test('home renders core regions', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-overview-board')).toBeVisible();
});
