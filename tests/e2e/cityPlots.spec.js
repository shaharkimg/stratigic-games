import { test, expect } from '@playwright/test';
import { startNewGame, sheetIsOpen } from './helpers.js';

test.describe('city plot accessibility', () => {
  test('mouse click on a built plot opens its building sheet', async ({ page }) => {
    await startNewGame(page);
    await page.locator('[data-act="bsheet"][data-id="townhall"]').first().click({ force: true });
    await page.waitForTimeout(200);
    expect(await sheetIsOpen(page)).toBe(true);
    await expect(page.locator('#sheet')).toContainText('מרכז הכפר');
  });

  test('keyboard: focusing a plot and pressing Enter opens the same sheet', async ({ page }) => {
    await startNewGame(page);
    const plot = page.locator('[data-act="bsheet"][data-id="townhall"]').first();
    await plot.focus();
    await expect(plot).toBeFocused();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    expect(await sheetIsOpen(page)).toBe(true);
    await expect(page.locator('#sheet')).toContainText('מרכז הכפר');
  });

  test('keyboard: pressing Space also activates a plot control', async ({ page }) => {
    await startNewGame(page);
    const plot = page.locator('[data-act="bsheet"][data-id="townhall"]').first();
    await plot.focus();
    await page.keyboard.press(' ');
    await page.waitForTimeout(200);
    expect(await sheetIsOpen(page)).toBe(true);
  });

  test('touch tap on an empty plot opens the build catalog', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.use.hasTouch, 'requires a project with hasTouch enabled (the mobile/tablet viewport projects)');
    await startNewGame(page);
    // Tap the visible "+" label circle rather than the invisible hit
    // polygon's bounding-box center: plot footprints are hand-authored
    // irregular polygons, and a bounding box's geometric center can fall
    // outside a concave polygon — the label marker is always a real,
    // reliably-placed point a person would actually tap.
    const marker = page.locator('.cvLbl[data-act="plotpick"] circle').first();
    const box = await marker.boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(200);
    expect(await sheetIsOpen(page)).toBe(true);
    await expect(page.locator('#sheet')).toContainText('מגרש פנוי');
  });

  test('every plot control exposes role=button, tabindex=0 and a non-empty aria-label', async ({ page }) => {
    await startNewGame(page);
    const controls = page.locator('.cvHit[data-act]');
    const count = await controls.count();
    expect(count).toBeGreaterThan(5);
    for (let i = 0; i < count; i++) {
      const el = controls.nth(i);
      await expect(el).toHaveAttribute('role', 'button');
      await expect(el).toHaveAttribute('tabindex', '0');
      const label = await el.getAttribute('aria-label');
      expect(label).toBeTruthy();
    }
  });

  test('decorative crest/panel overlays never intercept pointer events', async ({ page }) => {
    // Regression check for a pre-existing bug found while building this
    // suite: the decorative corner overlays (painted last in the SVG, so
    // visually on top of everything) used to swallow clicks meant for any
    // plot control underneath their masked corner region — reproduced via
    // document.elementFromPoint() landing on the overlay's <use> instead of
    // the plot's <g role="button">. Fixed with pointer-events:none since
    // they are purely decorative.
    await startNewGame(page);
    const allNone = await page.evaluate(() => {
      const overlays = document.querySelectorAll('svg.cv > g[mask]');
      return overlays.length > 0 && Array.from(overlays).every((g) => getComputedStyle(g).pointerEvents === 'none');
    });
    expect(allNone).toBe(true);
  });
});
