import { test, expect } from '@playwright/test';
import VocabLinkApp from './helpers/vocab-link-app';

// test('<template>', async ({ page }) => {
//   const app = new VocabLinkPage(page);
//   await app.goto();
// });

/** TODO:
 * test add antonym
 * test add word form
 * test add form in each word (should not contain duplicate entry)
 *  */

test.describe('test language and POS zone', () => {
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

    // add pos
    await page.getByPlaceholder('Add part of speech...').fill('Noun');
    await app.waitUntilTagChoicesVisible();
    await page.getByText('Noun', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Noun' })).toBeVisible();
  });
});

test.describe('test meaning zone', () => {
  test('can add new word', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();
    await app.addWord('test word');
    await app.selectWord('test word');

    // add word and link
    await page.getByPlaceholder('Add meaning...').fill('test word 2');
    await app.waitUntilTagChoicesVisible();
    await page.getByText('Add "test word 2" and connect', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'test word 2' })).toBeVisible();
  });

  test('can select linked meaning word and go to word\'s page', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();
    await app.addWord('test word');
    await app.selectWord('test word');

    // add word and link
    await page.getByPlaceholder('Add meaning...').fill('test word 2');
    await app.waitUntilTagChoicesVisible();
    await page.getByText('Add "test word 2" and connect', { exact: true }).click();

    // go to linked word
    const new_word_page = page.getByRole('button', { name: 'test word 2' });
    await expect(new_word_page).toBeVisible();
    await new_word_page.click();
    await expect(page.getByText('Word: test word 2')).toBeVisible();
  });

  test('can link to existed word', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();
    await app.addWord('test word 1');
    await app.addWord('test word 2');
    await app.selectWord('test word 1');

    // link existed word
    await page.getByPlaceholder('Add meaning...').fill('test word 2');
    await app.waitUntilTagChoicesVisible();
    await page.getByText('test word 2', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'test word 2' })).toBeVisible();
  });

  test('can delete linked meaning word', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();
    await app.addWord('test word 1');
    await app.addWord('test word 2');
    await app.selectWord('test word 1');

    // link word
    await page.getByPlaceholder('Add meaning...').fill('test word 2');
    await app.waitUntilTagChoicesVisible();
    await page.getByText('test word 2', { exact: true }).click();
    // get word button
    const linkedWord = page.getByRole('button', { name: 'test word 2' });
    await expect(linkedWord).toBeVisible();

    // delete word
    await page.locator('button:has-text("test word 2") > span').click();
    await expect(linkedWord).not.toBeVisible();
  });
});
