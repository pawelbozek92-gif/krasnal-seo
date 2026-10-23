import { expect, test, type Page } from '@playwright/test';
import { skipConsentBanner, CONSENT_KEY } from './helpers';
import { hero, welcomeAudio } from '../../src/data/motion';

const video = (page: Page) => page.locator('[data-hero-video]');
const playButton = (page: Page) => page.locator('[data-wa-toggle]');

function trackMedia(page: Page) {
  const urls: string[] = [];
  page.on('request', (r) => {
    if (/\/(video|audio)\//.test(r.url())) urls.push(new URL(r.url()).pathname);
  });
  return urls;
}

test.describe('hero video', () => {
  test.beforeEach(async ({ page }) => skipConsentBanner(page));

  test('loads exactly one rendition for the viewport, after load, and autoplays muted', async ({ page, isMobile }) => {
    const media = trackMedia(page);
    await page.goto('/');
    await expect.poll(() => video(page).evaluate((v: HTMLVideoElement) => v.currentSrc)).not.toBe('');
    await video(page).scrollIntoViewIfNeeded(); // on phones the video is below the fold (paused until visible)

    const expected = isMobile ? hero.sources.mobile.webm : hero.sources.desktop.webm;
    expect(await video(page).evaluate((v: HTMLVideoElement) => new URL(v.currentSrc).pathname)).toBe(expected);
    await expect.poll(() => video(page).evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime > 0)).toBe(true);
    expect(await video(page).evaluate((v: HTMLVideoElement) => v.muted && v.loop)).toBe(true);

    const files = media.filter((u) => /\.(webm|mp4)$/.test(u));
    expect(new Set(files).size).toBe(1);
    expect(media.some((u) => u.startsWith('/audio/'))).toBe(false); // audio is preload="none"
  });

  test('is a framed 16:9 visual, hidden from assistive tech with a text alternative', async ({ page }) => {
    await page.goto('/');
    await expect(video(page)).toHaveAttribute('aria-hidden', 'true');
    await expect(video(page)).toHaveAttribute('poster', hero.poster);
    await expect(page.locator('.hero-video figcaption')).toHaveText(hero.description);
    const box = await page.locator('.hero-video__frame').boundingBox();
    expect(box!.width / box!.height).toBeCloseTo(16 / 9, 1);
  });

  test('headline column comes first; LCP is text or the poster, never a video frame', async ({ page }) => {
    await page.goto('/');
    const [copy, frame] = [await page.locator('.hero__copy').boundingBox(), await page.locator('.hero-video__frame').boundingBox()];
    expect(frame!.y >= copy!.y + copy!.height - 1 || frame!.x >= copy!.x + copy!.width - 1).toBe(true);

    // Let the video start, then read the final LCP candidate.
    await expect.poll(() => video(page).evaluate((v: HTMLVideoElement) => v.currentSrc)).not.toBe('');
    const lcp = await page.evaluate(
      () =>
        new Promise<{ tag: string; url: string; time: number }>((resolve) =>
          new PerformanceObserver((list) => {
            const e = list.getEntries().at(-1) as PerformanceEntry & { element?: Element; url: string };
            resolve({ tag: e.element?.tagName ?? '', url: e.url, time: e.startTime });
          }).observe({ type: 'largest-contentful-paint', buffered: true }),
        ),
    );
    if (lcp.tag === 'VIDEO') expect(new URL(lcp.url).pathname).toBe(hero.poster);
    expect(lcp.time).toBeLessThan(2000);
  });

  test('pauses off-screen and resumes when scrolled back', async ({ page }) => {
    await page.goto('/');
    await video(page).scrollIntoViewIfNeeded();
    await expect.poll(() => video(page).evaluate((v: HTMLVideoElement) => !v.paused)).toBe(true);
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect.poll(() => video(page).evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    await video(page).scrollIntoViewIfNeeded();
    await expect.poll(() => video(page).evaluate((v: HTMLVideoElement) => !v.paused)).toBe(true);
  });

  test('prefers-reduced-motion shows the static frame and downloads no video', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const media = trackMedia(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.hero-video__static')).toBeVisible();
    await expect(video(page)).toBeHidden();
    expect(media.filter((u) => /\.(webm|mp4)$/.test(u))).toEqual([]);
    expect(await video(page).evaluate((v: HTMLVideoElement) => v.querySelectorAll('source').length)).toBe(0);
  });
});

test.describe('welcome audio', () => {
  test.beforeEach(async ({ page }) => skipConsentBanner(page));

  test('never autoplays; plays, pauses, resumes and restarts the video', async ({ page }) => {
    const media = trackMedia(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(media.some((u) => u.startsWith('/audio/'))).toBe(false);

    const btn = playButton(page);
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await video(page).scrollIntoViewIfNeeded();
    await expect.poll(() => video(page).evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(2);

    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(btn).toContainText('Pauza');
    await expect(page.locator('[data-wa-status]')).toHaveText('Odtwarzanie powitania.');
    expect(await video(page).evaluate((v: HTMLVideoElement) => v.currentTime)).toBeLessThan(2);

    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await expect(btn).toContainText('Wznów');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  test('works from the keyboard', async ({ page }) => {
    await page.goto('/');
    await playButton(page).focus();
    await page.keyboard.press('Enter');
    await expect(playButton(page)).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Space');
    await expect(playButton(page)).toHaveAttribute('aria-pressed', 'false');
  });

  test('falls back to MP3 when Opus fails', async ({ page }) => {
    await page.route('**/audio/*.opus', (route) => route.fulfill({ status: 404 }));
    const media = trackMedia(page);
    await page.goto('/');
    await playButton(page).click();
    await expect(playButton(page)).toHaveAttribute('aria-pressed', 'true');
    expect(media).toEqual(expect.arrayContaining([welcomeAudio.jingle.mp3, welcomeAudio.voice.mp3]));
  });

  test('transcript toggle', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Transkrypcja' });
    await expect(page.locator('#wa-transcript')).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#wa-transcript')).toContainText(welcomeAudio.transcript);
  });

  const gaEvents = (page: Page) =>
    page.evaluate(
      (name) => ((window as any).dataLayer as IArguments[]).filter((e) => e[0] === 'event' && e[1] === name).length,
      welcomeAudio.analyticsEvent,
    );

  test('GA4 event only after analytics consent', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => ((window as any).__ga4Id = 'G-TEST123'));
    await playButton(page).click();
    await expect(playButton(page)).toHaveAttribute('aria-pressed', 'true');
    expect(await gaEvents(page)).toBe(0);
  });

  test('GA4 event is sent when consent was granted', async ({ page }) => {
    await page.route(/googletagmanager\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    await page.addInitScript((key) => localStorage.setItem(key, 'granted'), CONSENT_KEY);
    await page.goto('/');
    await page.evaluate(() => ((window as any).__ga4Id = 'G-TEST123'));
    await playButton(page).click();
    await expect(playButton(page)).toHaveAttribute('aria-pressed', 'true');
    expect(await gaEvents(page)).toBe(1);
  });
});
