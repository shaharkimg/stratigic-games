import { test, expect } from '@playwright/test';
import { startNewGame } from './helpers.js';

async function openResearch(page) {
  await page.evaluate(() => { S.b.academy = 3; UI.screen = 'city'; UI.ctab = 'research'; render(true); });
  await page.waitForTimeout(150);
}

test.describe('research tree', () => {
  test('shows all 4 tech families with tiered nodes', async ({ page }) => {
    await startNewGame(page);
    await openResearch(page);
    const names = await page.locator('.techFam h3').allTextContents();
    expect(names.sort()).toEqual(['חברה', 'חקירה', 'כלכלה', 'צבא'].sort());
    expect(await page.locator('.techNode').count()).toBeGreaterThan(15);
  });

  test('a completed tech shows the done state', async ({ page }) => {
    await startNewGame(page);
    await page.evaluate(() => { S.b.academy = 3; S.tech = ['crop']; UI.screen = 'city'; UI.ctab = 'research'; render(true); });
    await page.waitForTimeout(150);
    await expect(page.locator('.techNode.done')).toContainText('מחזור זרעים');
  });

  test('a locked tech (academy level too low) shows why, with no action button', async ({ page }) => {
    await startNewGame(page);
    await page.evaluate(() => { S.b.academy = 1; UI.screen = 'city'; UI.ctab = 'research'; render(true); });
    await page.waitForTimeout(150);
    const ocean = page.locator('.techNode.locked').filter({ hasText: 'ניווט באוקיינוס' });
    await expect(ocean).toBeVisible();
    await expect(ocean.locator('button')).toHaveCount(0);
  });

  test('starting research shows it as active with a sticky progress card', async ({ page }) => {
    await startNewGame(page);
    await openResearch(page);
    await page.locator('.techNode.available button[data-act="research"]').first().click();
    await page.waitForTimeout(150);
    await expect(page.locator('.card.sticky-progress')).toBeVisible();
    await expect(page.locator('.techNode.active')).toHaveCount(1);
  });

  test('while research is active, other available techs offer "add to queue" instead of "research"', async ({ page }) => {
    await startNewGame(page);
    await page.evaluate(() => {
      S.b.academy = 3;
      S.rs = { id: 'ironw', end: S.t + 5, start: S.t - 3 };
      UI.screen = 'city'; UI.ctab = 'research'; render(true);
    });
    await page.waitForTimeout(150);
    await expect(page.locator('[data-act="research"]')).toHaveCount(0);
    const queueBtn = page.locator('[data-act="queueresearch"]').first();
    await expect(queueBtn).toBeVisible();
  });

  test('queueing a tech shows it in the "next" line and marks the node queued; unqueueing clears it', async ({ page }) => {
    await startNewGame(page);
    await page.evaluate(() => {
      S.b.academy = 3;
      S.rs = { id: 'ironw', end: S.t + 5, start: S.t - 3 };
      UI.screen = 'city'; UI.ctab = 'research'; render(true);
    });
    await page.waitForTimeout(150);
    await page.locator('[data-act="queueresearch"]').first().click();
    await page.waitForTimeout(150);
    await expect(page.locator('.techNode.queued')).toHaveCount(1);
    await expect(page.locator('.card.sticky-progress')).toContainText('בתור הבא');

    await page.locator('[data-act="unqueueresearch"]').first().click();
    await page.waitForTimeout(150);
    await expect(page.locator('.techNode.queued')).toHaveCount(0);
  });
});
