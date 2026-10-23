import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { allPages, skipConsentBanner } from './helpers';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Scrolls through the page so every scroll-reveal finishes; axe then audits the settled state. */
async function settleReveals(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => document.querySelectorAll('[data-reveal]').length === 0, null, { timeout: 5000 });
}

async function expectNoViolations(page: Page) {
  await settleReveals(page);
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`);
  expect(summary, summary.join('\n')).toEqual([]);
}

test.describe('WCAG 2.1 AA (axe-core)', () => {
  test.beforeEach(async ({ page }) => skipConsentBanner(page));

  for (const path of [...allPages, '/nie-ma-takiej-strony/']) {
    test(`${path}`, async ({ page }) => {
      await page.goto(path);
      await expectNoViolations(page);
    });
  }

  test('calculator with every option selected, in brutto', async ({ page }) => {
    await page.goto('/cennik/');
    await page.locator('label').filter({ hasText: /^Brutto$/ }).click();
    await page.getByRole('radio', { name: /^SCALE/ }).check();
    await page.getByRole('checkbox', { name: /Audyt SEO \+ roadmapa/ }).check();
    await page.getByRole('checkbox', { name: /Strategia treści/ }).check();
    await page.getByRole('button', { name: 'Dodaj godzinę konsultacji' }).click();
    await page.getByLabel('Miesięczny budżet na treści i linki').fill('2000');
    await expectNoViolations(page);
  });

  test('contact form showing validation errors', async ({ page }) => {
    await page.goto('/kontakt/');
    await page.getByRole('button', { name: 'Wyślij wiadomość' }).click();
    await expectNoViolations(page);
  });

  test('open mobile menu', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    await page.getByRole('button', { name: 'Otwórz menu' }).click();
    await expectNoViolations(page);
  });

  test('all FAQ items expanded', async ({ page }) => {
    await page.goto('/cennik/');
    await page.locator('.faq details').evaluateAll((els) => els.forEach((d) => ((d as HTMLDetailsElement).open = true)));
    await expectNoViolations(page);
  });
});

test('cookie banner is accessible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('dialog', { name: 'Pliki cookies' })).toBeVisible();
  await expectNoViolations(page);
});

test('keyboard users see a focus indicator and the skip link works', async ({ page }) => {
  await skipConsentBanner(page);
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Przejdź do treści' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#tresc$/);

  await page.keyboard.press('Tab');
  const shadow = await page.evaluate(() => getComputedStyle(document.activeElement!).boxShadow);
  expect(shadow).not.toBe('none');
});

test('reduced motion disables transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await skipConsentBanner(page);
  await page.goto('/');
  const duration = await page.locator('.btn').first().evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(parseFloat(duration)).toBeLessThan(0.01);
});
