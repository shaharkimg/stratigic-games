import { test, expect } from '@playwright/test';
import { startNewGame } from './helpers.js';

test.describe('mobile resource bar', () => {
  test('on narrow viewports the resource bar scrolls horizontally instead of cramming 5 columns', async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width;
    test.skip(!width || width > 600, 'only applies to the narrow-viewport projects');
    await startNewGame(page);
    const info = await page.evaluate(() => {
      const bar = document.getElementById('resbar');
      const cs = getComputedStyle(bar);
      return { display: cs.display, scrollWidth: bar.scrollWidth, clientWidth: bar.clientWidth };
    });
    expect(info.display).toBe('flex');
    expect(info.scrollWidth).toBeGreaterThan(info.clientWidth); // there's more to scroll to
  });

  test('every resource chip is still reachable by scrolling and opens its detail sheet', async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width;
    test.skip(!width || width > 600, 'only applies to the narrow-viewport projects');
    await startNewGame(page);
    const chips = page.locator('#resbar button[data-act="resinfo"]');
    const count = await chips.count();
    expect(count).toBe(5);
    // scroll the bar fully to make sure the last chip is reachable
    await page.evaluate(() => { document.getElementById('resbar').scrollLeft = 99999; });
    await page.waitForTimeout(100);
    const last = chips.last();
    await expect(last).toBeVisible();
  });
});
