import { test, expect } from '@playwright/test';
import { startNewGame, sheetIsOpen } from './helpers.js';

test.describe('bottom sheet', () => {
  test('opening a building sheet shows a sticky header with a close (X) button', async ({ page }) => {
    await startNewGame(page);
    await page.locator('.cvHit[data-act="bsheet"][data-id="townhall"]').click({ force: true });
    await page.waitForTimeout(200);
    expect(await sheetIsOpen(page)).toBe(true);
    const closeBtn = page.locator('.sheetX');
    await expect(closeBtn).toBeVisible();
    const box = await closeBtn.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('the close button still renders after the sheet self-refreshes (regression: a second render path used to skip the header)', async ({ page }) => {
    // Regression: renderCity()'s live-refresh paths for the 'bld' and
    // 'cpanel' sheets used to write #sheet's innerHTML directly with just
    // the old grab-handle markup, bypassing openSheet()'s header — so the
    // close button vanished the moment anything called render(true) while
    // a building sheet was open (which happens constantly: building,
    // queueing, etc. all call render(true)).
    await startNewGame(page);
    await page.locator('.cvHit[data-act="bsheet"][data-id="townhall"]').click({ force: true });
    await page.waitForTimeout(200);
    await page.evaluate(() => { render(true); });
    await page.waitForTimeout(200);
    await expect(page.locator('.sheetX')).toBeVisible();
  });

  test('clicking the close button closes the sheet', async ({ page }) => {
    await startNewGame(page);
    await page.locator('.cvHit[data-act="bsheet"][data-id="townhall"]').click({ force: true });
    await page.waitForTimeout(200);
    await page.locator('.sheetX').click();
    await page.waitForTimeout(200);
    expect(await sheetIsOpen(page)).toBe(false);
  });

  test('Escape closes the sheet', async ({ page }) => {
    await startNewGame(page);
    await page.locator('.cvHit[data-act="bsheet"][data-id="townhall"]').click({ force: true });
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    expect(await sheetIsOpen(page)).toBe(false);
  });

  test('the sheet title stays visible (sticky) when the sheet content is scrolled', async ({ page }) => {
    await startNewGame(page);
    await page.locator('.cvHit[data-act="bsheet"][data-id="townhall"]').click({ force: true });
    await page.waitForTimeout(200);
    const title = page.locator('#sheet .sheetTitle').first();
    const before = await title.boundingBox();
    await page.evaluate(() => { document.getElementById('sheet').scrollTop = 300; });
    await page.waitForTimeout(150);
    const after = await title.boundingBox();
    // still on-screen near the top, not scrolled away with the rest of the content
    expect(after.y).toBeLessThan(before.y + 60);
    expect(after.y).toBeGreaterThan(-5);
  });
});
