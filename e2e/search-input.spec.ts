import { test, expect } from '@playwright/test';
import VocabLinkApp from './helpers/vocab-link-app';

// test('<template>', async ({ page }) => {
//   const app = new VocabLinkPage(page);
//   await app.goto();
// });

test('can type meta+k to focus', async ({ page }) => {
  const app = new VocabLinkApp(page);
  await app.goto();

  const input = await app.selectSearchInput();
  await page.keyboard.press('Control+k');
  await expect(input).toBeFocused();
});

test('can interact with search input correctly', async ({ page }) => {
  const app = new VocabLinkApp(page);
  await app.goto();

  // try search for a new word
  const input = await app.selectSearchInput();
  await input.click();
  await input.fill('test');
  const search_word_choices = await page.locator('ul#search-word-choices');
  await expect(search_word_choices).toBeVisible();
  await expect(page.getByText('Add "test" as a new word')).toBeVisible();

  // expect clear button to clear text
  const clearButton = page.locator('#search-word-container').getByRole('button');
  await expect(clearButton).toBeVisible();
  await clearButton.click();
  await expect(input).toBeEmpty();

  // try create a word by CLICK
  await input.click();
  await input.fill('test');
  await expect(search_word_choices).toBeVisible();
  await page.getByText('Add "test" as a new word').click();
  await expect(page.getByText('Word: test')).toBeVisible();

  // deselect word
  const closeWordButton = page.locator('button#deselect-word-btn');
  await closeWordButton.click();

  // try create a word by press ENTER
  await input.click();
  await input.fill('test2');
  await expect(search_word_choices).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Word: test2')).toBeVisible();

  // deselect word again
  await closeWordButton.click();

  // both test and test2 should be in the word suggestion
  await input.click();
  await input.fill('test');
  await expect(search_word_choices).toBeVisible();
  await expect(page.getByText('test', { exact: true })).toBeVisible();
  await expect(page.getByText('test2')).toBeVisible();
});