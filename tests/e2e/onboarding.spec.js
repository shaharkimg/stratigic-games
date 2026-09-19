import { test, expect } from '@playwright/test';
import { startNewGame, INDEX_URL } from './helpers.js';

// Note: `S`/`UI`/`render`/`save`/`boot` are read as bare identifiers inside
// page.evaluate() rather than `window.S` etc. — they are top-level
// `let`/`const` bindings in the page's own classic (non-module) script, so
// they are NOT properties of `window`, but they ARE reachable as ordinary
// in-scope identifiers from any code evaluated in the page's global realm,
// which is how Playwright's page.evaluate() runs. See tests/README.md.
//
// Also note: reloading with an existing save does NOT auto-skip the intro
// screen today — it shows the intro with a "continue the saved season"
// button the player must click. Making that automatic is out of scope for
// this PR (see the roadmap's later phase for that); these tests cover the
// current, correct behavior: the save is offered and, once continued,
// loads (and migrates) correctly rather than being discarded.

test('onboarding: new game reaches the city view with the town hall built', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startNewGame(page);

  await expect(page.locator('.cvHit[data-act="bsheet"][data-id="townhall"]')).toBeVisible();
  const screen = await page.evaluate(() => UI.screen);
  expect(screen).toBe('city');
  expect(errors).toEqual([]);
});

test('reload: an existing save is offered via a "continue" button and loads correctly', async ({ page }) => {
  await startNewGame(page);
  await page.evaluate(() => {
    S.res.gold = 4242; render(true); save();
  });
  await page.reload();
  await page.waitForTimeout(500);

  const introVisible = await page.evaluate(() => document.getElementById('intro').classList.contains('on'));
  expect(introVisible).toBe(true);
  await expect(page.locator('#cont')).toBeVisible();
  await page.click('#cont');
  await page.waitForTimeout(300);

  const introVisibleAfter = await page.evaluate(() => document.getElementById('intro').classList.contains('on'));
  expect(introVisibleAfter).toBe(false);
  const gold = await page.evaluate(() => S.res.gold);
  // >= rather than === : the game clock is fast (1 real second can cross an
  // in-game hour boundary — HOUR_MS is 2000ms at 1x speed), so boot()'s
  // catch-up simulation may tick a little passive income between save()
  // and reload finishing. The point of this test is that the save loaded
  // at all, not exact income timing.
  expect(gold).toBeGreaterThanOrEqual(4242);
});

test('a save from an older schema (missing S.plot) migrates instead of being discarded', async ({ page }) => {
  await page.goto(INDEX_URL);
  await page.evaluate(() => {
    const legacy = {
      v: 1, t: 6, seen: Date.now(), site: 'homevalley', cityName: 'בדיקה', ruler: 'בודק',
      home: { c: 5, r: 5 }, tiles: [], res: { food: 300, wood: 300, stone: 300, iron: 100, gold: 200 },
      goods: {}, b: { castle: 0, townhall: 1 }, // no S.plot, no S.spec on purpose
      queue: [], units: {}, moves: [], reports: [], offers: [], contracts: [], chron: [], dec: [],
      npcs: [], camps: [], tech: [], district: [], flags: {}, stats: { won: 0, tradeVol: 0, broken: 0, artifacts: [] },
      rep: { honor: 0, trade: 0 }, sat: { food: 1 }, orders: {}, market: {}, speed: 1,
    };
    localStorage.setItem('empires_riverlands_v1', JSON.stringify(legacy));
  });
  await page.reload();
  await page.waitForTimeout(500);
  await expect(page.locator('#cont')).toBeVisible(); // the save was recognized, not treated as absent/corrupt
  await page.click('#cont');
  await page.waitForTimeout(300);
  const plot = await page.evaluate(() => S.plot);
  expect(plot).toEqual({ townhall: 'townhall' });
});
