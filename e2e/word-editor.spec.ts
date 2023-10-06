import { test, expect } from '@playwright/test';
import VocabLinkPage from './helpers/index-page';

// test('<template>', async ({ page }) => {
//   const app = new VocabLinkPage(page);
//   await app.goto();
// });

test('can type meta+k to focus', async ({ page }) => {
  const app = new VocabLinkPage(page);
  await app.goto();
  
  const input = await app.selectSearchInput();
  await page.keyboard.press('Control+k');
  await expect(input).toBeFocused();
});

test('can interact with search input correctly', async ({ page, }) => {
  const app = new VocabLinkPage(page);
  await app.goto();
  
  // try search for a new word
  const input = await app.selectSearchInput();
  await input.click();
  await input.fill('test');
  const search_word_choices = await page.locator('ul#search-word-choices');
  await expect(search_word_choices).toBeVisible();
  await expect(page.getByText('Add "test" as a new word')).toBeVisible();

  // expect clear button to clear text
  const clear_button = page.locator('#search-word-container').getByRole('button');
  await expect(clear_button).toBeVisible();
  await clear_button.click();
  await expect(input).toBeEmpty();

  // try create a word by CLICK or type ENTER
  await input.click();
  await input.fill('test');
  await expect(search_word_choices).toBeVisible();
  await page.getByText('Add "test" as a new word').click();
  await expect(page.getByText('Word: test')).toBeVisible();
});