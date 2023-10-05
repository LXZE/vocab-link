import { test, expect } from '@playwright/test';
import VocabLinkPage from './helpers/index-page';

test('has title', async ({ page }) => {
  const app = new VocabLinkPage(page);
  await app.goto();

  await expect(page).toHaveTitle(/Vocab Link/);
});
