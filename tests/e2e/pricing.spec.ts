import { expect, test, type Page } from '@playwright/test';
import { norm, skipConsentBanner } from './helpers';
import { packages, projectById, budgetOptions } from '../../src/data/pricing';
import { calculate, type CalcInput } from '../../src/lib/calc';
import { formatPLN, toGross } from '../../src/lib/format';
import { site } from '../../src/config/site';

const money = (n: number) => norm(formatPLN(n));
const out = (page: Page, name: string) => page.locator(`[data-calc] [data-out="${name}"]`);
const row = (page: Page, name: string) => page.locator(`[data-calc] [data-row="${name}"]`);

test.beforeEach(async ({ page }) => {
  await skipConsentBanner(page);
  await page.goto('/cennik/');
});

test('package cards show prices and hours from pricing.ts', async ({ page }) => {
  for (const p of packages) {
    const card = page.locator(`#pakiet-${p.id}`);
    await expect(card.locator('[data-price-net]')).toHaveText(new RegExp(money(p.priceNet).replace(/ /g, '\\s')));
    await expect(card).toContainText(`${p.hours} h`);
    await expect(card.getByRole('link', { name: /Umów bezpłatną rozmowę/ })).toHaveAttribute('href', `/kontakt/?pakiet=${p.id}#formularz`);
  }
  await expect(page.locator('#pakiet-growth')).toContainText('Najczęściej wybierany');
});

test('netto/brutto toggle switches every price', async ({ page }) => {
  test.skip(!site.vatPayer, 'Toggle exists only for VAT payers');
  const growth = packages.find((p) => p.id === 'growth')!;
  const cardPrice = page.locator('#pakiet-growth [data-price-net]');

  await page.locator('label').filter({ hasText: /^Brutto$/ }).click();
  await expect(cardPrice).toHaveText(new RegExp(money(toGross(growth.priceNet, site.vatRate)).replace(/ /g, '\\s')));
  await expect(page.locator('[data-calc] [data-vat-long]')).toContainText('brutto');
  await expect(out(page, 'retainer')).toHaveText(new RegExp(money(toGross(growth.priceNet, site.vatRate)).replace(/ /g, '\\s')));

  await page.locator('label').filter({ hasText: /^Netto$/ }).click();
  await expect(cardPrice).toHaveText(new RegExp(money(growth.priceNet).replace(/ /g, '\\s')));
});

test('calculator totals, audit credit and hours match the pricing logic', async ({ page }) => {
  const input: CalcInput = { packageId: 'scale', audit: true, strategy: true, consultingHours: 4, contentBudget: 1250 };
  const expected = calculate(input);

  await page.getByRole('radio', { name: /^SCALE/ }).check();
  await page.getByRole('checkbox', { name: /Audyt SEO \+ roadmapa/ }).check();
  await page.getByRole('checkbox', { name: /Strategia treści/ }).check();
  const plus = page.getByRole('button', { name: 'Dodaj godzinę konsultacji' });
  for (let i = 0; i < 4; i++) await plus.click();
  await page.getByLabel('Miesięczny budżet na treści i linki').fill('1250');

  await expect(out(page, 'hours')).toHaveText(`${expected.hours} h`);
  await expect(out(page, 'hours-extra')).toContainText('4 h konsultacji');
  expect(norm(await out(page, 'monthly').textContent())).toBe(money(expected.monthlyTotal));
  expect(norm(await out(page, 'oneoff').textContent())).toBe(money(expected.oneOffTotal));
  expect(norm(await out(page, 'credit').textContent())).toBe(money(-expected.auditCredit));
  expect(norm(await out(page, 'first').textContent())).toBe(money(expected.firstMonthTotal));
  await expect(row(page, 'credit')).toBeVisible();
  await expect(row(page, 'budget')).toBeVisible();

  // Screen-reader summary is announced (debounced).
  await expect(out(page, 'live')).toContainText(`pierwszy miesiąc ${formatPLN(expected.firstMonthTotal)}`);

  // Removing the retainer removes the audit credit.
  await page.getByRole('radio', { name: /^Bez abonamentu/ }).check();
  await expect(row(page, 'credit')).toBeHidden();
  expect(norm(await out(page, 'first').textContent())).toBe(
    money(calculate({ ...input, packageId: 'none' }).firstMonthTotal),
  );
});

test('calculator is fully keyboard operable', async ({ page }) => {
  await page.getByRole('radio', { name: /^GROWTH/ }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', { name: /^SCALE/ })).toBeChecked();
  await expect(out(page, 'retainer-label')).toHaveText('Abonament SCALE');

  await page.getByRole('checkbox', { name: /Audyt SEO \+ roadmapa/ }).focus();
  await page.keyboard.press('Space');
  await expect(row(page, 'credit')).toBeVisible();

  await page.getByRole('button', { name: 'Dodaj godzinę konsultacji' }).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel(/Dodatkowe godziny konsultacji/)).toHaveValue('2');

  const slider = page.getByLabel('Miesięczny budżet na treści i linki');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('500');
  await expect(slider).toHaveAttribute('aria-valuetext', formatPLN(500));
});

test('stepper stays within 0–20 hours', async ({ page }) => {
  const input = page.getByLabel(/Dodatkowe godziny konsultacji/);
  await page.getByRole('button', { name: 'Odejmij godzinę konsultacji' }).click();
  await expect(input).toHaveValue('0');
  await input.fill('50');
  await input.blur();
  await expect(input).toHaveValue('20');
});

test('CTA carries the configuration into the contact form', async ({ page }) => {
  await page.getByRole('radio', { name: /^START/ }).check();
  await page.getByRole('checkbox', { name: /Audyt SEO \+ roadmapa/ }).check();
  await page.getByRole('link', { name: /Wyślij ten zakres/ }).click();

  await expect(page).toHaveURL(/\/kontakt\/\?konfiguracja=/);
  const hidden = page.locator('input[name="pricing_config"]');
  await expect(hidden).toHaveValue(/Pakiet: START/);
  await expect(hidden).toHaveValue(/Audyt SEO \+ roadmapa/);
  await expect(hidden).toHaveValue(/Zaliczenie audytu/);
  await expect(page.locator('[data-config-box]')).toBeVisible();
  const monthly = calculate({ packageId: 'start', audit: true, strategy: false, consultingHours: 0, contentBudget: 0 }).monthlyTotal;
  const option = budgetOptions.find((o) => o.max >= monthly)!.value;
  await expect(page.getByLabel(/Miesięczny budżet na SEO/)).toHaveValue(option);
});

test('comparison table: open on desktop, collapsible on mobile', async ({ page, isMobile }) => {
  const details = page.locator('[data-compare]');
  const table = details.getByRole('table');
  if (isMobile) {
    await expect(table).toBeHidden();
    await details.getByText('Porównaj wszystkie pakiety').click();
  }
  await expect(table).toBeVisible();
  await expect(table.getByRole('columnheader')).toHaveCount(packages.length + 1);
});

test('audit price on the audit page comes from pricing.ts', async ({ page }) => {
  await page.goto('/audyt-seo/');
  expect(norm(await page.locator('.audit-price__amount').textContent())).toBe(money(projectById('audit').priceNet));
});
