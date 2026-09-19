import { fileURLToPath } from 'node:url';

export const INDEX_URL = 'file://' + fileURLToPath(new URL('../../index.html', import.meta.url));

// Shared setup for E2E specs: starts a fresh game past onboarding and
// settles any auto-opened decision sheet so tests have a clean, predictable
// starting point.
export async function startNewGame(page) {
  await page.goto(INDEX_URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('text=עמק הנהר', { timeout: 5000 });
  await page.click('text=עמק הנהר');
  await page.click('text=להקים את היישוב');
  await page.waitForTimeout(1200); // the first decision sheet opens on a setTimeout
  await page.evaluate(() => {
    // Clear the auto-opened "first winter" decision and any build queue so
    // tests start from a clean, deterministic city view. `S` and `UI` are
    // top-level `let`/`const` bindings in the page's own script (not module
    // scoped), so they — like any other top-level binding — are reachable
    // as bare identifiers from page.evaluate() even though they are NOT
    // properties of `window` (only function declarations are).
    S.dec = [];
    S.queue = [];
    closeSheet();
    render(true);
  });
  await page.waitForTimeout(200);
}

export async function sheetIsOpen(page) {
  const cls = await page.$eval('#sheetWrap', (el) => el.className);
  return cls.includes('on');
}
