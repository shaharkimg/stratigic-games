import { test, expect } from '@playwright/test';
import { startNewGame } from './helpers.js';

test.describe('city progression visuals', () => {
  test('a building under active construction shows a progress ring with a percentage', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await startNewGame(page);
    await page.evaluate(() => {
      S.plot.market = 'market'; S.b.market = 0;
      const total = bTime('market', 1);
      S.queue = [{ b: 'market', l: 1, end: S.t + total * 0.6 }];
      render(true);
    });
    await page.waitForTimeout(200);
    const ring = page.locator('.cvRing');
    await expect(ring).toBeVisible();
    const text = await ring.locator('text').last().textContent();
    expect(text).toMatch(/^\d+%$/);
    expect(errors).toEqual([]);
  });

  test('the progress ring percentage reflects how much of the build time has elapsed', async ({ page }) => {
    await startNewGame(page);
    // Freeze the game clock (speed=0 stops the real-time accumulator) so
    // the two readings below are deterministic instead of racing the
    // engine's real-time tick (HOUR_MS is only 2000ms at 1x speed).
    // `end` is a deadline in the future: end = S.t + total*X means the
    // build finishes when X*total game-hours from now elapse, so a
    // LARGER X pushes the deadline further out (LESS of the build has
    // elapsed so far) and a SMALLER X means it's almost done.
    await page.evaluate(() => {
      S.speed = 0;
      S.plot.market = 'market'; S.b.market = 0;
      const total = bTime('market', 1);
      S.queue = [{ b: 'market', l: 1, end: S.t + total * 0.9 }]; // deadline far off -> low progress
      render(true);
    });
    await page.waitForTimeout(150);
    const early = await page.locator('.cvRing text').last().textContent();
    expect(parseInt(early)).toBeLessThanOrEqual(100);

    await page.evaluate(() => {
      const total = bTime('market', 1);
      S.queue = [{ b: 'market', l: 1, end: S.t + total * 0.2 }]; // deadline near -> high progress
      render(true);
    });
    await page.waitForTimeout(150);
    const late = await page.locator('.cvRing text').last().textContent();
    expect(parseInt(late)).toBeGreaterThan(parseInt(early));
    expect(parseInt(late)).toBeLessThanOrEqual(100);
  });

  test('the progress ring never shows over 100% even if the queue end time has already passed', async ({ page }) => {
    // Regression: the ring's geometry clamped to [0,1] but the percentage
    // TEXT did not, so a stale/just-completed queue entry could briefly
    // show e.g. "102%".
    await startNewGame(page);
    await page.evaluate(() => {
      S.speed = 0;
      S.plot.market = 'market'; S.b.market = 0;
      const total = bTime('market', 1);
      S.queue = [{ b: 'market', l: 1, end: S.t - total * 0.2 }]; // end already in the past
      render(true);
    });
    await page.waitForTimeout(150);
    const text = await page.locator('.cvRing text').last().textContent();
    expect(parseInt(text)).toBeLessThanOrEqual(100);
  });

  test('a fully built plot (not under construction) shows no progress ring', async ({ page }) => {
    await startNewGame(page);
    await page.waitForTimeout(200);
    // townhall is built and not under active construction in a fresh game
    await expect(page.locator('.cvRing')).toHaveCount(0);
  });

  test('the next-milestone chip shows the townhall requirement when that is the blocker', async ({ page }) => {
    await startNewGame(page);
    await page.waitForTimeout(200);
    const chip = page.locator('.cChip.mile');
    await expect(chip).toBeVisible();
    await expect(chip).toContainText('דורש מרכז הכפר רמה');
  });

  test('the next-milestone chip switches to a population progress bar once the townhall requirement is met', async ({ page }) => {
    await startNewGame(page);
    await page.evaluate(() => { S.b.townhall = 2; S.pop = 90; render(true); });
    await page.waitForTimeout(200);
    const chip = page.locator('.cChip.mile');
    await expect(chip).toContainText('90');
    await expect(chip.locator('.miniBar i')).toBeVisible();
  });

  test('the milestone chip disappears once the city reaches the final stage', async ({ page }) => {
    await startNewGame(page);
    await page.evaluate(() => { S.b.townhall = 5; S.pop = 700; render(true); });
    await page.waitForTimeout(200);
    await expect(page.locator('.cChip.mile')).toHaveCount(0);
  });
});
