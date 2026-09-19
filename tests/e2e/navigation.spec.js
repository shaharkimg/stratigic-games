import { test, expect } from '@playwright/test';
import { startNewGame } from './helpers.js';

test.describe('navigation', () => {
  test('the bottom bar has exactly three destinations: world, city, realm', async ({ page }) => {
    await startNewGame(page);
    const tabs = await page.locator('#tabs button').evaluateAll((els) => els.map((e) => e.dataset.s));
    expect(tabs).toEqual(['world', 'city', 'realm']);
  });

  test('city has build/trade/research as sub-routes, not top-level tabs', async ({ page }) => {
    await startNewGame(page);
    await expect(page.locator('[data-act="ctab"][data-v="build"]')).toBeVisible();
    await expect(page.locator('[data-act="ctab"][data-v="trade"]')).toBeVisible();
    await expect(page.locator('[data-act="ctab"][data-v="research"]')).toBeVisible();

    await page.click('[data-act="ctab"][data-v="trade"]');
    await page.waitForTimeout(150);
    await expect(page.locator('h2').first()).toContainText('הצעות סחר');
    // still on the "city" bottom-tab while browsing its trade sub-route
    await expect(page.locator('#tabs button[data-s="city"]')).toHaveClass(/on/);

    await page.click('[data-act="ctab"][data-v="research"]');
    await page.waitForTimeout(150);
    await expect(page.locator('h2').first()).toContainText('מחקר');
    await expect(page.locator('#tabs button[data-s="city"]')).toHaveClass(/on/);
  });

  test('realm keeps army/diplomacy/government/chronicle as sub-routes, without trade or research', async ({ page }) => {
    await startNewGame(page);
    await page.click('#tabs button[data-s="realm"]');
    await page.waitForTimeout(150);
    const subtabs = await page.locator('.subtabs button[data-act="rtab"]').evaluateAll((els) => els.map((e) => e.dataset.v));
    expect(subtabs).toEqual(['army', 'diplo', 'gov', 'chron']);
  });

  test('switching to city trade and back to build preserves the city map without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await startNewGame(page);
    await page.click('[data-act="ctab"][data-v="trade"]');
    await page.waitForTimeout(150);
    await page.click('[data-act="ctab"][data-v="build"]');
    await page.waitForTimeout(150);
    await expect(page.locator('.cvHit[data-act="bsheet"][data-id="townhall"]')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('the same screen never appears both on the bottom bar and as a sub-tab at once', async ({ page }) => {
    await startNewGame(page);
    const bottomTabs = await page.locator('#tabs button').evaluateAll((els) => els.map((e) => e.dataset.s));
    const cityTabs = await page.locator('[data-act="ctab"]').evaluateAll((els) => els.map((e) => e.dataset.v));
    await page.click('#tabs button[data-s="realm"]');
    await page.waitForTimeout(150);
    const realmTabs = await page.locator('[data-act="rtab"]').evaluateAll((els) => els.map((e) => e.dataset.v));
    const allSubroutes = [...cityTabs, ...realmTabs];
    for (const t of bottomTabs) expect(allSubroutes).not.toContain(t);
  });
});
