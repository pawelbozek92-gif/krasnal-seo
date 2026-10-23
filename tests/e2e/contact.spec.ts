import { expect, test, type Page } from '@playwright/test';
import { skipConsentBanner } from './helpers';

const ENDPOINT = '**/api/contact.php';

async function fillValid(page: Page) {
  await page.getByLabel('Imię i nazwisko *').fill('Jan Testowy');
  await page.getByLabel('Firma *').fill('Testowa Sp. z o.o.');
  await page.getByLabel('Adres strony www *').fill('testowa-firma.pl');
  await page.getByLabel('E-mail *').fill('jan@testowa-firma.pl');
  await page.getByLabel(/Miesięczny budżet na SEO/).selectOption('3000-5000');
  await page.getByLabel('Wiadomość *').fill('Chcemy zwiększyć liczbę zapytań z Google.');
  await page.getByLabel(/Wyrażam zgodę/).check();
}

test.beforeEach(async ({ page }) => skipConsentBanner(page));

test('empty submit shows every required-field error and focuses the first', async ({ page }) => {
  await page.goto('/kontakt/');
  await page.getByRole('button', { name: 'Wyślij wiadomość' }).click();

  await expect(page.locator('.field__error:not(:empty)')).toHaveCount(7);
  await expect(page.getByLabel('Imię i nazwisko *')).toBeFocused();
  await expect(page.getByLabel('Imię i nazwisko *')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('status')).toContainText('Popraw zaznaczone pola');
});

test('validates e-mail, website and optional phone formats', async ({ page }) => {
  await page.goto('/kontakt/');
  await fillValid(page);
  await page.getByLabel('E-mail *').fill('jan@');
  await page.getByLabel('Adres strony www *').fill('nie strona');
  await page.getByLabel(/Telefon/).fill('abc');
  await page.getByRole('button', { name: 'Wyślij wiadomość' }).click();

  await expect(page.locator('#f-email-err')).toHaveText('Podaj poprawny adres e-mail.');
  await expect(page.locator('#f-website-err')).not.toBeEmpty();
  await expect(page.locator('#f-phone-err')).not.toBeEmpty();
});

test('successful submission posts all fields and redirects to the thank-you page', async ({ page }) => {
  let body = '';
  await page.route(ENDPOINT, async (route) => {
    body = route.request().postData() ?? '';
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/kontakt/?pakiet=growth');
  await fillValid(page);
  await page.getByRole('button', { name: 'Wyślij wiadomość' }).click();

  await expect(page).toHaveURL(/\/dziekujemy\/$/);
  for (const field of ['name', 'company', 'website', 'email', 'budget', 'message', 'consent', 'pricing_config', 'source', 'fax', 'started_at']) {
    expect(body, field).toContain(`name="${field}"`);
  }
  expect(body).toContain('Interesuje mnie pakiet: GROWTH');
});

test('server error keeps the visitor on the form with a message', async ({ page }) => {
  await page.route(ENDPOINT, (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false}' }));
  await page.goto('/kontakt/');
  await fillValid(page);
  await page.getByRole('button', { name: 'Wyślij wiadomość' }).click();

  await expect(page.getByRole('status')).toContainText('Nie udało się wysłać');
  await expect(page.getByRole('button', { name: 'Spróbuj ponownie' })).toBeEnabled();
  await expect(page).toHaveURL(/\/kontakt\//);
});

test('a non-JSON 200 response is not treated as success', async ({ page }) => {
  await page.route(ENDPOINT, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<?php // not executed' }));
  await page.goto('/kontakt/');
  await fillValid(page);
  await page.getByRole('button', { name: 'Wyślij wiadomość' }).click();
  await expect(page.getByRole('status')).toContainText('Nie udało się wysłać');
});

test('honeypot is hidden from people and keyboard users', async ({ page }) => {
  await page.goto('/kontakt/');
  const hp = page.locator('input[name="fax"]');
  await expect(hp).toHaveAttribute('tabindex', '-1');
  const box = await hp.boundingBox();
  expect(box === null || box.x < 0).toBe(true);
});

test('audit page form identifies its source', async ({ page }) => {
  await page.goto('/audyt-seo/');
  await expect(page.locator('input[name="source"]')).toHaveValue('audyt-seo');
  await expect(page.getByRole('button', { name: 'Zamów audyt' })).toBeVisible();
});
