import { test, expect } from '@playwright/test';
import VocabLinkApp from './helpers/vocab-link-app';

test.describe('test editor label', () => {
  test('can show label correctly', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();

    // idle should show title text
    await expect(page.getByText('Try to search, create a word or select in graph')).toBeVisible();

    // should show word after select
    await app.addWord('test word');
    await app.selectWord('test word');
    await expect(page.getByText('Word: test word')).toBeVisible();
  });
  test('can edit word text', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();
    await app.addWord('test word');
    await app.selectWord('test word');

    // click edit and save
    const labelInput = page.locator('#node-text-editor');
    await page.locator('#edit-word-text-btn').click();
    await expect(labelInput).toBeVisible();
    await expect(labelInput).toHaveValue('test word');
    await labelInput.fill('test');
    await page.locator('#save-word-text-btn').click();
    await expect(page.getByText('Word: test')).toBeVisible();

    // click edit and cancel
    await page.locator('#edit-word-text-btn').click();
    await expect(labelInput).toBeVisible();
    await expect(labelInput).toHaveValue('test');
    await page.locator('#cancel-edit-word-btn').click();
    await expect(page.getByText('Word: test')).toBeVisible();

    // click edit then click on canvas to get off edit mode
    await page.locator('#edit-word-text-btn').click();
    await expect(labelInput).toBeVisible();
    await page.locator('canvas').click();
    await expect(page.getByText('Try to search, create a word or select in graph')).toBeVisible();
  });
});