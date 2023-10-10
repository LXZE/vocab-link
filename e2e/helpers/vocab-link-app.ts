import { expect, type Page } from '@playwright/test';

export default class VocabLinkApp {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
  }

  async selectSearchInput() {
    return this.page.locator('input#search-word-input');
  }

  async addWord(text: string) {
    const input = await this.selectSearchInput();
    await input.click();
    await input.fill(text);

    const search_word_choices = await this.page.locator('ul#search-word-choices');
    await expect(search_word_choices).toBeVisible();
    await this.page.getByText(`Add "${text}" as a new word`).click();
    await expect(this.page.getByText(`Word: ${text}`)).toBeVisible();

    await this.deselectWord();
  }

  async selectWord(text: string) {
    const input = await this.selectSearchInput();
    await input.click();
    await input.fill(text);

    const search_word_choices = await this.page.locator('ul#search-word-choices');
    await expect(search_word_choices).toBeVisible();

    const target = this.page.getByText(text, { exact: true });
    await expect(target).toBeVisible();
    await target.click();
    await search_word_choices.waitFor({ state: 'hidden' });
  }

  async deselectWord() {
    await this.page.locator('button#deselect-word-btn').click();
  }

  async waitUntilTagChoicesVisible() {
    await this.page.locator('#tag-choices-list').waitFor({ state: 'visible' });
  }

  async clickAddWordForm() {
    await this.page.getByRole('button', { name: 'Add more form' }).click();
  }

  async clickDeleteWordAndConfirm() {
    await this.page.getByRole('button', { name: 'Delete' });
  }
}
