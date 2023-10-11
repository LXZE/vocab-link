import { test, expect } from '@playwright/test';
import VocabLinkApp from './helpers/vocab-link-app';

test.describe('test setting page', () => {
  test('can show & hide setting page', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();

    // open setting
    const settingButton = page.locator('#setting-btn').getByRole('button');
    await settingButton.click();
    await expect(page.getByText('Import & Export')).toBeVisible();

    // close setting
    await settingButton.click();
    await expect(page.getByText('Import & Export')).not.toBeVisible();
  });

  test('can export database', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();
    await app.addWord('test');

    // open setting
    const settingButton = page.locator('#setting-btn').getByRole('button');
    await settingButton.click();
    await expect(page.getByText('Import & Export')).toBeVisible();

    // try click Export database
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export Database' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toEqual('vocab.db');
    await download.saveAs('./playwright-report/' + download.suggestedFilename());
  });

  test('can import database', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();

    // open setting
    const settingButton = page.locator('#setting-btn').getByRole('button');
    await settingButton.click();
    await expect(page.getByText('Import & Export')).toBeVisible();

    // try click Import database
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Import Database' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('./playwright-report/vocab.db');

    // go to main page
    await settingButton.click();
    await expect(page.getByText('Import & Export')).not.toBeVisible();

    // select word should be possible
    await app.selectWord('test');
    await expect(page.getByText('Word: test')).toBeVisible();
  });
});