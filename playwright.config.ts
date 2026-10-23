import { defineConfig, devices } from '@playwright/test';

const PORT = 4322;
const CI = !!process.env.CI;

/**
 * End-to-end tests run against the built site (`npm run build` first),
 * served by `astro preview`. Desktop and mobile (Pixel 7) projects.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: 'pl-PL',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      // Build-output / metadata checks don't depend on the viewport.
      testIgnore: /seo\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npm run preview -- --port ${PORT} --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !CI,
    timeout: 60_000,
  },
});
