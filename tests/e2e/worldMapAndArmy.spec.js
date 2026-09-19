import { test, expect } from '@playwright/test';
import { startNewGame } from './helpers.js';

test.describe('world map legend', () => {
  test('each map layer shows a legend matching its own content', async ({ page }) => {
    await startNewGame(page);
    await page.evaluate(() => { UI.screen = 'world'; render(true); });
    await page.waitForTimeout(200);

    await expect(page.locator('.mapLegend .legItem').first()).toBeVisible();
    const terrainCount = await page.locator('.mapLegend .legItem').count();
    expect(terrainCount).toBeGreaterThan(3); // one per biome

    await page.click('[data-act="layer"][data-v="political"]');
    await page.waitForTimeout(150);
    await expect(page.locator('.mapLegend')).toContainText('השטח שלך');
    await expect(page.locator('.mapLegend')).toContainText('במחלוקת');

    await page.click('[data-act="layer"][data-v="military"]');
    await page.waitForTimeout(150);
    await expect(page.locator('.mapLegend')).toContainText('אספקה מלאה');
    await expect(page.locator('.mapLegend')).toContainText('אספקה מתוחה');

    await page.click('[data-act="layer"][data-v="trade"]');
    await page.waitForTimeout(150);
    await expect(page.locator('.mapLegend')).toContainText('שיירות');
  });
});

test.describe('army standing orders', () => {
  async function openArmy(page) {
    await page.evaluate(() => { UI.screen = 'realm'; UI.rtab = 'army'; render(true); });
    await page.waitForTimeout(150);
  }

  test('standing-order groups are exposed as role=group with aria-pressed options', async ({ page }) => {
    await startNewGame(page);
    await openArmy(page);
    await expect(page.locator('.seg[role="group"]')).toHaveCount(2);
    const raidBtns = page.locator('[data-act="order"][data-k="raid"]');
    await expect(raidBtns).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      const v = await raidBtns.nth(i).getAttribute('aria-pressed');
      expect(['true', 'false']).toContain(v);
    }
  });

  test('exactly one option per group is aria-pressed=true, matching the current order', async ({ page }) => {
    await startNewGame(page);
    await openArmy(page);
    const pressedRaid = page.locator('[data-act="order"][data-k="raid"][aria-pressed="true"]');
    await expect(pressedRaid).toHaveCount(1);
    const pressedInc = page.locator('[data-act="order"][data-k="incoming"][aria-pressed="true"]');
    await expect(pressedInc).toHaveCount(1);
  });

  test('changing a standing order updates aria-pressed and shows a confirmation toast', async ({ page }) => {
    await startNewGame(page);
    await openArmy(page);
    const payBtn = page.locator('[data-act="order"][data-k="raid"][data-v="pay"]');
    await expect(payBtn).toHaveAttribute('aria-pressed', 'false');
    await payBtn.click();
    await page.waitForTimeout(150);
    await expect(page.locator('[data-act="order"][data-k="raid"][data-v="pay"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-act="order"][data-k="raid"][data-v="fight"]')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#toasts .toast').last()).toBeVisible();
    const state = await page.evaluate(() => S.orders.raid);
    expect(state).toBe('pay');
  });
});
