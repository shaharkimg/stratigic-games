// @ts-check
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexUrl = 'file://' + path.join(__dirname, 'index.html');

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
    launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-360', use: { viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true } },
    { name: 'mobile-390', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
    { name: 'mobile-430', use: { viewport: { width: 430, height: 932 }, hasTouch: true, isMobile: true } },
    { name: 'tablet-768', use: { viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true } },
  ],
});
