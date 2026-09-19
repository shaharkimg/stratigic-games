// @ts-check
import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexUrl = 'file://' + path.join(__dirname, 'index.html');
const configuredChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const legacyChromium = '/opt/pw-browsers/chromium';
const executablePath = configuredChromium || (fs.existsSync(legacyChromium) ? legacyChromium : undefined);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: indexUrl,
    trace: 'retain-on-failure',
    // This environment ships a single pre-installed chromium binary rather
    // than the exact per-package revision Playwright normally pins (and
    // browser auto-download is disabled here) — point every project at it
    // directly instead of the "Desktop Chrome" device preset's default
    // chrome-headless-shell channel, which isn't present on disk.
    // Use an explicitly configured/system browser when available, otherwise
    // let Playwright use the browser revision installed for this package.
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-360', use: { viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true } },
    { name: 'mobile-390', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
    { name: 'tablet-768', use: { viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true } },
  ],
});
