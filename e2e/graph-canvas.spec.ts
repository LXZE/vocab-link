import { test, expect } from '@playwright/test';
import VocabLinkApp from './helpers/vocab-link-app';

// test('<template>', async ({ page }) => {
//   const app = new VocabLinkPage(page);
//   await app.goto();
// });

test('can click expand and minimize to resize graph canvas', async ({ page }) => {
  const app = new VocabLinkApp(page);
  await app.goto();

  const pageWidth = await page.viewportSize()?.width ?? 1280;
  const startCanvasWidth = (await page.locator('#canvas-envelope').first().boundingBox())?.width ?? 0;

  await page.locator('#canvas-expand').click();
  await page.waitForTimeout(200);
  const expandedCanvasWidth = (await page.locator('#canvas-envelope').first().boundingBox())?.width ?? Infinity;
  expect(expandedCanvasWidth).toBeGreaterThan(startCanvasWidth);
  expect(Math.abs(pageWidth - (expandedCanvasWidth))).toBeLessThan(10); // width diff should not exceed 10px

  await page.locator('#canvas-minimize').click();
  await page.waitForTimeout(200);
  const resizedCanvasSize = (await page.locator('#canvas-envelope').first().boundingBox())?.width ?? -Infinity;
  expect(startCanvasWidth).toEqual(resizedCanvasSize);
});
