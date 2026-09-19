import { test, expect } from '@playwright/test';
import { startNewGame } from './helpers.js';

async function openGov(page) {
  await page.evaluate(() => { UI.screen = 'realm'; UI.rtab = 'gov'; render(true); });
  await page.waitForTimeout(150);
}

// Matches on the node's own name (.techN) rather than the whole node's text,
// since a node's "why" explanation often mentions the OTHER stages by name
// (e.g. the Nation node's requirement text contains the word "League"),
// which would make a plain hasText filter match more than one node.
function stageNode(page, name) {
  return page.locator('.techTree .techNode').filter({ has: page.locator('.techN', { hasText: name }) });
}

test.describe('government roadmap', () => {
  test('an independent city shows League as the active stage, Nation and Kingdom locked', async ({ page }) => {
    await startNewGame(page);
    await openGov(page);
    await expect(page.locator('.techTree .techNode')).toHaveCount(3);
    await expect(stageNode(page, 'ליגה')).toHaveClass(/active/);
    await expect(stageNode(page, 'אומה')).toHaveClass(/locked/);
    await expect(stageNode(page, 'ממלכה')).toHaveClass(/locked/);
  });

  test('a city in a league shows League done, Nation active with its requirements', async ({ page }) => {
    await startNewGame(page);
    await page.evaluate(() => {
      S.bloc = 'own'; S.own = { n: 'ליגת הבדיקה', members: ['ardan', 'ironhold'] };
      UI.screen = 'realm'; UI.rtab = 'gov'; render(true);
    });
    await page.waitForTimeout(150);
    await expect(stageNode(page, 'ליגה')).toHaveClass(/done/);
    await expect(stageNode(page, 'אומה')).toHaveClass(/active/);
    await expect(stageNode(page, 'אומה')).toContainText('יום 18');
  });

  test('a declared monarchy nation shows all three stages done', async ({ page }) => {
    await startNewGame(page);
    await page.evaluate(() => {
      S.bloc = 'own'; S.own = { n: 'ליגת הבדיקה', members: ['ardan', 'ironhold'] };
      S.nation = { n: 'ממלכת בדיקה', gov: 'monarchy', role: null, head: true, treasury: 100, projects: [], pending: [], founder: true };
      UI.screen = 'realm'; UI.rtab = 'gov'; render(true);
    });
    await page.waitForTimeout(150);
    await expect(stageNode(page, 'ליגה')).toHaveClass(/done/);
    await expect(stageNode(page, 'אומה')).toHaveClass(/done/);
    await expect(stageNode(page, 'ממלכה')).toHaveClass(/done/);
  });

  test('a declared non-monarchy nation shows Kingdom as permanently locked for this game, not as achievable', async ({ page }) => {
    // Regression: Kingdom's "active" state used to be `nationDone && !kingdomDone`,
    // which stayed true forever once a non-monarchy government was chosen —
    // implying Kingdom was still one step away, when in fact the government
    // type is chosen once at nation declaration and can never change.
    await startNewGame(page);
    await page.evaluate(() => {
      S.bloc = 'own'; S.own = { n: 'ליגת הבדיקה', members: ['ardan', 'ironhold'] };
      S.nation = { n: 'הרפובליקה של בדיקה', gov: 'republic', role: null, head: true, treasury: 100, projects: [], pending: [], founder: true };
      UI.screen = 'realm'; UI.rtab = 'gov'; render(true);
    });
    await page.waitForTimeout(150);
    const kingdom = stageNode(page, 'ממלכה');
    await expect(kingdom).toHaveClass(/locked/);
    await expect(kingdom).not.toHaveClass(/active/);
    await expect(kingdom).toContainText('רפובליקה');
  });
});
