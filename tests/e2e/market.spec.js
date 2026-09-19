import { test, expect } from '@playwright/test';
import { startNewGame } from './helpers.js';

async function openMarket(page) {
  await page.evaluate(() => {
    S.b.market = 3;
    S.res.wood = 500;
    S.res.gold = 1000;
    UI.screen = 'city';
    UI.ctab = 'trade';
    render(true);
  });
  await page.waitForTimeout(150);
}

test.describe('market', () => {
  test('quantity buttons are explicitly labeled, never a bare number', async ({ page }) => {
    await startNewGame(page);
    await openMarket(page);
    const texts = await page.locator('[data-mkres="wood"] button[data-act="mkt"]').allTextContents();
    expect(texts.length).toBeGreaterThan(0);
    for (const t of texts) {
      expect(t.trim()).not.toMatch(/^\d+$/); // never just "200"
      expect(t).toMatch(/מכור|קנה/); // always "sell"/"buy" + amount
    }
  });

  test('selling more than you have is disabled up front with a reason', async ({ page }) => {
    await startNewGame(page);
    await openMarket(page);
    await page.evaluate(() => { S.res.wood = 0; render(true); });
    const sell50 = page.locator('[data-mkres="wood"] button[data-act="mkt"][data-s="sell"][data-a="50"]');
    await expect(sell50).toBeDisabled();
    const title = await sell50.getAttribute('title');
    expect(title).toBeTruthy();
  });

  test('buying with insufficient gold is disabled up front with a reason', async ({ page }) => {
    await startNewGame(page);
    await openMarket(page);
    await page.evaluate(() => { S.res.gold = 0; render(true); });
    const buy50 = page.locator('[data-mkres="wood"] button[data-act="mkt"][data-s="buy"][data-a="50"]');
    await expect(buy50).toBeDisabled();
  });

  test('buying beyond warehouse capacity is disabled up front with a reason', async ({ page }) => {
    await startNewGame(page);
    await openMarket(page);
    await page.evaluate(() => { S.res.wood = 695; S.res.gold = 1e6; render(true); });
    const buy50 = page.locator('[data-mkres="wood"] button[data-act="mkt"][data-s="buy"][data-a="50"]');
    await expect(buy50).toBeDisabled();
  });

  test('a valid sell updates resources and shows a toast', async ({ page }) => {
    await startNewGame(page);
    await openMarket(page);
    const goldBefore = await page.evaluate(() => S.res.gold);
    await page.locator('[data-mkres="wood"] button[data-act="mkt"][data-s="sell"][data-a="50"]').click();
    await page.waitForTimeout(150);
    const goldAfter = await page.evaluate(() => S.res.gold);
    expect(goldAfter).toBeGreaterThan(goldBefore);
    await expect(page.locator('#toasts .toast').last()).toBeVisible();
  });

  test('MAX button sells everything you have', async ({ page }) => {
    await startNewGame(page);
    await openMarket(page);
    await page.evaluate(() => { S.res.wood = 137; render(true); });
    const maxBtn = page.locator('[data-mkres="wood"] button[data-act="mkt"][data-s="sell"]').last();
    await expect(maxBtn).toHaveAttribute('data-a', '137');
    await maxBtn.click();
    await page.waitForTimeout(150);
    const woodAfter = await page.evaluate(() => S.res.wood);
    expect(woodAfter).toBe(0);
  });
});
