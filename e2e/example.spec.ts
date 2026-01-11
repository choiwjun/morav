import { test, expect } from '@playwright/test';

test('홈페이지가 로드되어야 함', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Morav|Next/);
});
