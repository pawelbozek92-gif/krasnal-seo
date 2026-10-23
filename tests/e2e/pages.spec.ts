import { expect, test } from '@playwright/test';
import { allPages, collectErrors, skipConsentBanner } from './helpers';
import { site } from '../../src/config/site';

test.beforeEach(async ({ page }) => skipConsentBanner(page));

for (const path of allPages) {
  test(`${path} renders cleanly`, async ({ page }) => {
    const errors = collectErrors(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);

    await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
    await expect(page.locator('h1')).toHaveCount(1);
    expect((await page.title()).length).toBeGreaterThan(10);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${site.url}${path}`);

    // Every image has alt text and explicit dimensions (no layout shift).
    await expect(page.locator('img:not([alt])')).toHaveCount(0);
    await expect(page.locator('img:not([width]), img:not([height])')).toHaveCount(0);

    // No horizontal scrolling at any viewport.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
}

test('unknown URL returns the 404 page', async ({ page }) => {
  const res = await page.goto('/nie-ma-takiej-strony/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('tej strony nie ma');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('header and footer links all resolve', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('header a[href^="/"], footer a[href^="/"]')
    .evaluateAll((links) => [...new Set(links.map((a) => a.getAttribute('href')!))]);
  expect(hrefs).toEqual(expect.arrayContaining(['/cennik/', '/audyt-seo/', '/konsultant-seo-wroclaw/', '/polityka-prywatnosci/']));
  for (const href of hrefs) {
    expect((await request.get(href)).status(), href).toBe(200);
  }
});

test('sticky header keeps the "Zamów audyt" CTA visible after scrolling', async ({ page }) => {
  await page.goto('/');
  await page.mouse.wheel(0, 3000);
  const cta = page.locator('header').getByRole('link', { name: 'Zamów audyt' }).locator('visible=true');
  await expect(cta.first()).toBeInViewport();
});

test('mobile menu opens, closes with Escape and returns focus', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Hamburger menu exists only on small screens');
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Otwórz menu' });
  const nav = page.getByRole('navigation', { name: 'Główna nawigacja' });

  await expect(nav).toBeHidden();
  await toggle.click();
  await expect(nav).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zamknij menu' })).toHaveAttribute('aria-expanded', 'true');

  await page.keyboard.press('Escape');
  await expect(nav).toBeHidden();
  await expect(toggle).toBeFocused();

  await toggle.click();
  await nav.getByRole('link', { name: 'Cennik' }).click();
  await expect(page).toHaveURL(/\/cennik\/$/);
});
