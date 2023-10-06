import { test, expect } from '@playwright/test';
import VocabLinkApp from './helpers/index-page';

// test('<template>', async ({ page }) => {
//   const app = new VocabLinkPage(page);
//   await app.goto();
// });

/** TODO:
 * test add meaning
 * test add antonym
 * test add form
 *  */

test('can add language to word editor', async ({ page }) => {
  const app = new VocabLinkApp(page);
  await app.goto();
  await app.addWord('test word');
  await app.selectWord('test word');

  // add language 1
  await page.getByPlaceholder('Add language...').fill('English');
  await app.waitUntilTagChoicesVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'English' })).toBeVisible();

  // add language 2
  await page.getByPlaceholder('Add language...').fill('Chinese');
  await app.waitUntilTagChoicesVisible();
  await page.getByText('Chinese', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Chinese' })).toBeVisible();
});

test('can add POS to word editor', async ({ page }) => {
  const app = new VocabLinkApp(page);
  await app.goto();
  await app.addWord('test word');
  await app.selectWord('test word');

  await page.getByPlaceholder('Add part of speech...').fill('Noun');
  await app.waitUntilTagChoicesVisible();
  await page.getByText('Noun', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Noun' })).toBeVisible();
});