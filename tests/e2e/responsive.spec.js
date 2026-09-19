import { test, expect } from '@playwright/test';
import { startNewGame } from './helpers.js';

test.describe('responsive layout', () => {
  test('no unintended horizontal overflow on the city screen', async ({ page }) => {
    await startNewGame(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1); // allow 1px rounding
  });

  test('city plot hit areas meet a 44px minimum on every tested viewport', async ({ page }) => {
    await startNewGame(page);
    const tooSmall = await page.evaluate(() => {
      const hits = Array.from(document.querySelectorAll('.cvHit[data-act]'));
      return hits.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width < 44 || r.height < 44;
      }).length;
    });
    expect(tooSmall).toBe(0);
  });

  test('key action buttons meet a 44px minimum tap target', async ({ page }) => {
    await startNewGame(page);
    const box = await page.locator('[data-act="bsheet"][data-id="townhall"]').first().boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
