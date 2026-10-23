// Lighthouse CI: mobile audits of the built site with score budgets.
//   npm run build && npm run test:lighthouse
// Uses CHROME_PATH if set, otherwise the browser installed by `npx playwright install chromium`
// (preferring its headless shell, which some Windows setups allow when full chrome.exe is blocked).
const fs = require('node:fs');
const path = require('node:path');

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const full = require('@playwright/test').chromium.executablePath();
  const browsersDir = path.resolve(full, '..', '..', '..');
  const shellDir = fs.existsSync(browsersDir) && fs.readdirSync(browsersDir).find((d) => d.startsWith('chromium_headless_shell-'));
  if (shellDir) {
    const root = path.join(browsersDir, shellDir);
    for (const sub of fs.readdirSync(root)) {
      for (const exe of ['chrome-headless-shell.exe', 'chrome-headless-shell', 'headless_shell']) {
        const candidate = path.join(root, sub, exe);
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }
  return full;
}
const chromePath = findChrome();

const pages = ['/', '/cennik/', '/audyt-seo/', '/kontakt/', '/o-mnie/', '/konsultant-seo-wroclaw/', '/case-studies/'];

module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: pages.map((p) => `http://localhost${p}`),
      numberOfRuns: Number(process.env.LHCI_RUNS || 1),
      chromePath,
      settings: { chromeFlags: '--no-sandbox --headless=new' },
    },
    assert: {
      assertMatrix: [
        {
          matchingUrlPattern: '.*',
          assertions: {
            'categories:performance': ['error', { minScore: 0.95 }],
            'categories:accessibility': ['error', { minScore: 0.95 }],
            'categories:best-practices': ['error', { minScore: 0.95 }],
            'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
            'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
            'total-blocking-time': ['warn', { maxNumericValue: 150 }],
          },
        },
        {
          // /case-studies/ is deliberately noindex while it only holds example entries.
          matchingUrlPattern: '^(?!.*/case-studies/$).*',
          assertions: { 'categories:seo': ['error', { minScore: 0.95 }] },
        },
      ],
    },
    upload: { target: 'filesystem', outputDir: './lighthouse-reports' },
  },
};
