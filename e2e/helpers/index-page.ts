import { type Page } from '@playwright/test';

export default class VocabLinkPage {
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
}
