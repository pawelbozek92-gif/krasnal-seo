import type { Page } from '@playwright/test';
import { caseStudies } from '../../src/data/case-studies';

export const CONSENT_KEY = 'ks-consent-v1';

/** Every route the site should serve with HTTP 200. */
export const allPages = [
  '/',
  '/cennik/',
  '/audyt-seo/',
  '/case-studies/',
  ...caseStudies.map((c) => `/case-studies/${c.slug}/`),
  '/o-mnie/',
  '/konsultant-seo-wroclaw/',
  '/kontakt/',
  '/polityka-prywatnosci/',
  '/dziekujemy/',
];

/** Pages meant for search engines (everything that is not noindex). */
export const indexablePages = [
  '/',
  '/cennik/',
  '/audyt-seo/',
  '/o-mnie/',
  '/konsultant-seo-wroclaw/',
  '/kontakt/',
  '/polityka-prywatnosci/',
];

/** Pretend the visitor already rejected cookies so the banner doesn't cover the page. */
export async function skipConsentBanner(page: Page) {
  await page.addInitScript((key) => {
    try {
      localStorage.setItem(key, 'denied');
    } catch {
      /* ignore */
    }
  }, CONSENT_KEY);
}

/** Collects console errors and uncaught exceptions for the lifetime of the page. */
export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

/** Normalises non-breaking spaces so formatted amounts can be compared as plain text. */
export const norm = (s: string | null | undefined) => (s ?? '').replace(/ /g, ' ').trim();
