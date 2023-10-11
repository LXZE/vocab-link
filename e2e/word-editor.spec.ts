import { test, expect } from '@playwright/test';
import VocabLinkApp from './helpers/vocab-link-app';

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

test.describe('test antonym zone', () => {
  test('can add new antonym word', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();
    await app.addWord('test word');
    await app.selectWord('test word');

    // add word and link
    await page.getByPlaceholder('Add antonym...').fill('test word 2');
    await app.waitUntilTagChoicesVisible();
    await page.getByText('Add "test word 2" and connect', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'test word 2' })).toBeVisible();
  });

  test('can select linked antonym word and go to word\'s page', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();
    await app.addWord('test word');
    await app.selectWord('test word');

    // add word and link
    await page.getByPlaceholder('Add antonym...').fill('test word 2');
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
    await page.getByPlaceholder('Add antonym...').fill('test word 2');
    await app.waitUntilTagChoicesVisible();
    await page.getByText('test word 2', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'test word 2' })).toBeVisible();
  });

  test('can delete linked antonym word', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();
    await app.addWord('test word 1');
    await app.addWord('test word 2');
    await app.selectWord('test word 1');

    // link word
    await page.getByPlaceholder('Add antonym...').fill('test word 2');
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


test.describe('test romanization', () => {
  test('can add romanization to word editor when word is not alphabet', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();
    await app.addWord('テスト');
    await app.selectWord('テスト');

    // add romanization
    await page.getByPlaceholder('Add romanization...').fill('test');
    await app.waitUntilTagChoicesVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'test' })).toBeVisible();
  });

  test('can delete romanization', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();
    await app.addWord('テスト');
    await app.selectWord('テスト');

    // add romanization
    await page.getByPlaceholder('Add romanization...').fill('tesuto');
    await app.waitUntilTagChoicesVisible();
    await page.keyboard.press('Enter');
    const linkedWord = page.getByRole('button', { name: 'tesuto' });
    await expect(linkedWord).toBeVisible();

    // delete romanization
    await page.locator('button:has-text("tesuto") > span').click();
    await expect(linkedWord).not.toBeVisible();
  });
});


test.describe('test word form', () => {
  test('can add & delete current word\'s form name', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();
    await app.addWord('test');
    await app.selectWord('test');

    await page.getByPlaceholder('Add form...').fill('form1');
    await app.waitUntilTagChoicesVisible();
    await page.keyboard.press('Enter');

    const linkedFormName = page.getByRole('button', { name: 'form1' });
    await expect(linkedFormName).toBeVisible();

    await page.locator('button:has-text("form1") > span').click();
    await expect(linkedFormName).not.toBeVisible();
  });
  test('can add & delete related word form', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();
    await app.addWord('test');
    await app.selectWord('test');

    // check if click add word form is working (show only 1)
    await app.clickAddWordForm();
    expect(await page.getByPlaceholder('Add form...').count()).toEqual(1);
    await app.clickAddWordForm();
    expect(await page.getByPlaceholder('Add form...').count()).toEqual(1);

    // add related word form
    await page.getByPlaceholder('Add word...').fill('test2');
    await app.waitUntilTagChoicesVisible();
    await page.keyboard.press('Enter');

    const linkedForm = page.getByRole('button', { name: 'test2' });
    await expect(linkedForm).toBeVisible();
    expect(await page.getByPlaceholder('Add form...').count()).toEqual(2);

    // add form on both words
    await page.getByPlaceholder('Add form...').first().fill('form0');
    await app.waitUntilTagChoicesVisible();
    await page.keyboard.press('Enter');
    await page.getByPlaceholder('Add form...').nth(1).fill('form1');
    await app.waitUntilTagChoicesVisible();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('button', { name: 'form0' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'form1' })).toBeVisible();

    // click linked word form and all word form must be visible
    await linkedForm.click();
    await expect(page.getByText('Word: test2')).toBeVisible();
    await expect(page.getByRole('button', { name: 'form0' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'form1' })).toBeVisible();

    // delete related word form
    await page.getByRole('button', { name: 'test', exact: true }).click();
    await expect(page.getByText('Word: test')).toBeVisible();
    await page.locator('button:has-text("test2") > span').click();
    await expect(page.getByRole('button', { name: 'test2' })).not.toBeVisible();
  });
});

test.describe('test word note', () => {
  test('can add note to word', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();
    await app.addWord('test');
    await app.selectWord('test');

    // add note and deselect
    const wordNoteTextArea = page.locator('textarea');
    const noteContent = 'test add note';
    await page.getByRole('checkbox').click();
    await expect(wordNoteTextArea).toBeVisible();
    await wordNoteTextArea.fill(noteContent);
    await expect(wordNoteTextArea).toHaveValue(noteContent);
    await app.deselectWord();

    // select word again should see note
    await app.selectWord('test');
    await page.getByRole('checkbox').click();
    await expect(wordNoteTextArea).toHaveValue(noteContent);
  });
});

test.describe('test delete word', () => {
  test('can delete word', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();
    await app.addWord('test');
    await app.selectWord('test');

    // delete word
    const deleteButton = page.getByRole('button', { name: 'Delete' });
    await deleteButton.click();
    expect(page.getByRole('heading', { name: 'Warning!' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(page.getByText('Word: test')).not.toBeVisible();
  });
  test('can cancel delete word', async ({ page }) => {
    const app = new VocabLinkApp(page);
    await app.goto();
    await app.addWord('test');
    await app.selectWord('test');

    // click delete and cancel
    const deleteButton = page.getByRole('button', { name: 'Delete' });
    await deleteButton.click();
    expect(page.getByRole('heading', { name: 'Warning!' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // page should remain the same
    await expect(page.getByText('Word: test')).toBeVisible();
  });
});