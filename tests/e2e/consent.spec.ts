import { expect, test, type Page } from '@playwright/test';
import { CONSENT_KEY } from './helpers';

const GOOGLE = /google-analytics\.com|googletagmanager\.com|doubleclick\.net/;

/** Records every request to Google and stubs gtag.js so tests never hit the network. */
async function watchGoogle(page: Page) {
  const hits: string[] = [];
  await page.route(GOOGLE, (route) => {
    hits.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
  });
  return hits;
}

const banner = (page: Page) => page.getByRole('dialog', { name: 'Pliki cookies' });

test('nothing from Google loads and no cookies are set before a choice', async ({ page, context }) => {
  const hits = await watchGoogle(page);
  await page.goto('/');
  await expect(banner(page)).toBeVisible();
  await page.waitForLoadState('networkidle');

  expect(hits).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  const defaults = await page.evaluate(() => (window as any).dataLayer[0]);
  expect(defaults[1]).toBe('default');
  expect(defaults[2]).toMatchObject({ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
});

test('accept and reject buttons have equal weight', async ({ page }) => {
  await page.goto('/');
  const reject = banner(page).getByRole('button', { name: 'Odrzucam' });
  const accept = banner(page).getByRole('button', { name: 'Akceptuję' });
  expect(await reject.getAttribute('class')).toBe(await accept.getAttribute('class'));
  const [a, b] = [await reject.boundingBox(), await accept.boundingBox()];
  expect(Math.abs(a!.width - b!.width)).toBeLessThan(2);
  expect(Math.abs(a!.height - b!.height)).toBeLessThan(2);
});

test('rejecting is remembered and still loads nothing', async ({ page }) => {
  const hits = await watchGoogle(page);
  await page.goto('/');
  await banner(page).getByRole('button', { name: 'Odrzucam' }).click();
  await expect(banner(page)).toBeHidden();
  expect(await page.evaluate((k) => localStorage.getItem(k), CONSENT_KEY)).toBe('denied');

  await page.reload();
  await expect(banner(page)).toBeHidden();
  await page.waitForLoadState('networkidle');
  expect(hits).toEqual([]);
});

test('accepting grants analytics consent and loads gtag.js only then', async ({ page }) => {
  const hits = await watchGoogle(page);
  await page.goto('/');
  // Simulate a configured GA4 ID (site.ts still holds TODO).
  await page.evaluate(() => ((window as any).__ga4Id = 'G-TEST123'));
  expect(hits).toEqual([]);

  await banner(page).getByRole('button', { name: 'Akceptuję' }).click();
  await expect(banner(page)).toBeHidden();
  await expect.poll(() => hits.length).toBeGreaterThan(0);
  expect(hits[0]).toContain('id=G-TEST123');

  const update = await page.evaluate(() =>
    (window as any).dataLayer.find((e: IArguments) => e[0] === 'consent' && e[1] === 'update'),
  );
  expect(update[2]).toMatchObject({ analytics_storage: 'granted' });
});

test('"Ustawienia cookies" in the footer reopens the banner', async ({ page }) => {
  await page.goto('/');
  await banner(page).getByRole('button', { name: 'Odrzucam' }).click();
  await page.getByRole('button', { name: 'Ustawienia cookies' }).click();
  await expect(banner(page)).toBeVisible();
  await expect(banner(page).getByRole('button', { name: 'Odrzucam' })).toBeFocused();
});
