# Krasnal SEO – website

Static company website for **Krasnal SEO** (senior SEO consultancy, Wrocław). Polish copy, English code.

- **Stack:** [Astro 5](https://astro.build) (static output), hand-written CSS with design tokens, a few small vanilla-JS islands (no framework runtime on the page).
- **Output:** plain HTML/CSS/JS in `dist/`, deployable to any shared hosting via FTP.

> Why no Tailwind: the whole design system is one ~15 kB token-based stylesheet (`src/styles/global.css`) plus scoped component styles, inlined into each page. That keeps the dependency list short and the pages render-blocking-free, which is how the site reaches 100/100 Lighthouse scores.

## Run & build

Requires Node.js 18.20+ (tested on Node 24).

```bash
npm install
npm run dev       # http://localhost:4321 (live reload)
npm run build     # static site → dist/
npm run preview   # serve dist/ locally
```

`npm run build` logs a **warning listing example case studies** that still need replacing.

## Deploy (shared hosting / FTP)

1. `npm run build`
2. Upload the **contents** of `dist/` to the web root (usually `public_html/`). Include the hidden `.htaccess`.
3. Contact form (pick one):
   - **Bundled PHP handler (default):** `formEndpoint: '/api/contact.php'`. Copy `contact-config.example.php` to `contact-config.php` **one level above** `public_html/`, set `recipient` and `from` (a mailbox on your domain, for SPF/DKIM deliverability). The real config is git-ignored.
   - **Form service:** set `formEndpoint` to e.g. `https://formspree.io/f/xxxxxxx` in `src/config/site.ts`, rebuild. The JS sends `Accept: application/json` and expects `{ "ok": true }`, which Formspree returns.
4. After SSL is active, uncomment the HTTPS/www redirect in `public/.htaccess`.
5. Submit `https://<domain>/sitemap-index.xml` in Google Search Console.

Note: the form cannot be tested with `npm run preview` (no PHP there). It correctly shows an error message in that case. Test it once on the hosting.

## Testing

One-time setup after `npm install`:

```bash
npx playwright install chromium
```

| Command | What it checks | Needs build? |
|---|---|---|
| `npm run test:unit` | Vitest: calculator maths, audit-credit rule, PLN formatting, pricing/case-study data integrity, form budget options = PHP allow-list | no |
| `npm run check:dist` | Every built page: one H1, `lang="pl"`, title/description, canonical, OG image, image `alt` + dimensions, JSON-LD parses, noindex ⇄ sitemap consistency, broken internal links, JS budget. Warns about remaining `[TODO]`s | yes |
| `npm run test:e2e` | Playwright on desktop + Pixel 7: all pages (200, no console errors, no horizontal scroll), 404, nav/footer links, mobile menu, pricing cards, netto/brutto, calculator totals and keyboard use, prefill into the form, form validation, submission (mocked endpoint) and error handling, cookie consent (no Google requests before consent), sitemap/robots/noindex, JSON-LD content, **axe-core WCAG 2.1 AA** on every page and key states | yes |
| `npm run test:lighthouse` | Lighthouse CI (mobile) on 7 pages. Fails below 95 in any category, LCP > 2 s or CLS > 0.05. HTML reports go to `lighthouse-reports/` | yes |
| `npm run test:php` | PHP handler smoke test with `php -S` and a fake sendmail: 405/422/honeypot/valid mail/header injection/no-JS redirect. Needs PHP + bash (runs in CI) | no |
| `npm test` | unit → build → check:dist → e2e → Lighthouse | builds |

- `npm run test:e2e:ui` opens Playwright's interactive UI. After a failure, `npx playwright show-report` shows traces and screenshots.
- E2E expectations are computed from `src/data/pricing.ts` and `src/lib/calc.ts`, so changing prices does not break the tests. Changing a *rule* (e.g. the audit credit) does.
- Lighthouse uses `CHROME_PATH` if set, otherwise Playwright's Chromium.
- **CI:** `.github/workflows/ci.yml` runs everything above (including the PHP test) on every push and pull request. Reports are uploaded as the `test-reports` artifact.

## Where to change things

| What | File |
|---|---|
| **Prices, hours, package inclusions, comparison table, commercial terms** | `src/data/pricing.ts` (single source of truth: cards, calculator, audit page, JSON-LD) |
| Business details, integrations, `vatPayer` flag | `src/config/site.ts` |
| FAQ texts | `src/data/faq.ts` |
| Case studies | `src/data/case-studies.ts` |
| Testimonials (renders nothing while empty) | `src/data/testimonials.ts` |
| Colours, fonts, spacing, motion durations | `src/styles/global.css` (`:root` tokens) |
| **Hero video, welcome audio, motion** (paths, breakpoint, audio mode, duck level, fades, transcript) | `src/data/motion.ts` |
| Logo | `src/assets/brand/logo-full.png`, `logo-mark.png` (see below) |

**VAT:** `vatPayer: true` shows "ceny netto + 23% VAT" and a netto/brutto toggle on `/cennik/`. `false` shows "zwolniony z VAT" and hides the toggle.

**Calculator rules** (`src/lib/calc.ts`): monthly = retainer + content/link budget; one-off = audit + strategy + consulting hours × 250 zł; the **audit credit** (50% = 2 250 zł) appears as a separate line and is subtracted from the first month only when an audit **and** a retainer are both selected. The CTA passes the configuration (always in netto) to `/kontakt/?konfiguracja=…&budzet=…`, where it fills a hidden form field and preselects the budget.

### Logo & icons

The logo was supplied as a raster with a baked-in checkerboard. `scripts/remove-logo-bg.mjs` removed the background and produced transparent `logo-full.png` and `logo-mark.png` (the dwarf mark). Astro converts them to AVIF/WebP at build time.

When the final logo is ready (ideally SVG or a transparent PNG):

1. Replace `src/assets/brand/logo-full.png` (and `logo-mark.png` for the dwarf mark).
2. `npm run assets` regenerates favicons, app icons and the OG image (`public/og-default.png`).

### Hero video & welcome audio

- Files: `public/video/` (`hero.webm/.mp4` 1280×720, `hero-mobile.webm/.mp4` 854×480, `hero-poster.webp`, `hero-static.webp`) and `public/audio/` (`jingle`, `powitanie` as `.opus` + `.mp3`, loudness-matched to −16 LUFS).
- Masters live in `media-src/` (git-ignored, not published). To regenerate everything after replacing a master, install ffmpeg and run:

  ```bash
  node scripts/encode-media.mjs
  ```

  The script drops the video's audio track, makes both renditions in VP9 and H.264, extracts the poster (frame 0) and the reduced-motion frame (`hero.payoffTime`), trims the jingle and normalises loudness.
- Video (`src/components/HeroVideo.astro`): sources are attached only after `load` (idle time), so the headline stays LCP. One rendition is picked by viewport width (WebM first, MP4 fallback). It pauses off-screen and in background tabs. `prefers-reduced-motion` shows the static frame and downloads no video.
- Audio (`src/components/WelcomeAudio.astro`) never autoplays.
  - In overlay mode the jingle plays at 100% for `introSeconds`, the voice starts at that moment and the jingle ducks to `duckLevel`; after the voice the jingle fades out over `fadeOutSeconds`, about 12 s in total.
  - Set `introSeconds: 0` for "start together".
  - Playback restarts the hero video, so the bar rises while the voice speaks.
  - The GA4 event `welcome_audio_play` is sent only after analytics consent.

### Motion

One timing scale (`--dur-fast` 200 ms … `--dur-slower` 900 ms, `--ease-out`) in `global.css`, mirrored in `src/data/motion.ts`. Hover transitions use 200–400 ms. Content below the fold fades in once on scroll (`src/scripts/reveal.ts`, 600 ms, 80 ms stagger); nothing in the first viewport animates except the video. All of it is off with `prefers-reduced-motion`.

## GitHub Pages preview

`.github/workflows/pages.yml` publishes every push to `main` as a **noindex preview** at `https://<user>.github.io/<repo>/`:

- It builds with `SITE_BASE=/<repo>` and `PREVIEW_NOINDEX=1` (adds `noindex` everywhere and a `Disallow: /` robots.txt).
- `scripts/rebase-dist.mjs` then prefixes internal links with the repository path.

The contact form can't send on Pages: it's static hosting with no PHP. It shows its error message there. Production still goes to shared hosting as described above.

## SEO & technical notes

- Clean Polish slugs without diacritics, trailing slashes, canonical on every page, unique titles/descriptions, OG + Twitter cards.
- JSON-LD `@graph` per page: `ProfessionalService` (all pages), `BreadcrumbList` (subpages), `Service` + `Offer` (packages on `/` and `/cennik/`, audit on `/audyt-seo/`, local service on `/konsultant-seo-wroclaw/`), `FAQPage` (`/`, `/cennik/`, `/audyt-seo/`, `/konsultant-seo-wroclaw/`), `Person` (`/o-mnie/`). Values still `TODO` are omitted from JSON-LD.
- `sitemap-index.xml` excludes `404`, `/dziekujemy/`, every `isExample` case study and `/case-studies/` while it only lists examples. Those pages also carry `noindex`.
- `robots.txt` is generated from the configured domain.
- Fonts: Manrope variable, self-hosted (`public/fonts/`), only the latin + latin-ext subsets, preloaded, `font-display: swap` with a metric-matched fallback (no layout shift).
- Analytics: Google Consent Mode v2 defaults set to *denied*. `gtag.js` is **not loaded at all** until the visitor clicks "Akceptuję". "Ustawienia cookies" in the footer reopens the banner. Withdrawing consent removes `_ga` cookies.

## Before launch (TODO)

Values marked `TODO` in `src/config/site.ts` render as visible `[TODO: …]` markers on the site.

- [ ] **Replace the 3 example case studies** in `src/data/case-studies.ts` with real, anonymised results (`isExample: false`). The badge, `noindex` and sitemap exclusion then go away automatically.
- [ ] **Add a real photo** on `/o-mnie/` and the home page (replace the `.photo-placeholder` blocks) and fill in the **experience** section on `/o-mnie/`.
- [ ] **Final logo**, ideally vector; then `npm run assets`.
- [ ] **Legal details** in `src/config/site.ts`: `legalName` (exactly as in CEIDG), `nip`, `address.street`, `address.postalCode`, `email`, `phone`.
- [ ] Confirm the final **domain** (`url` in `site.ts`, and the redirect in `public/.htaccess`).
- [ ] `linkedinUrl`, `bookingUrl` (Cal.com/Calendly), `ga4Id`, `gscVerification`.
- [ ] Form backend: `contact-config.php` on the server **or** a Formspree endpoint. Send a test submission.
- [ ] **Privacy policy** (`src/pages/polityka-prywatnosci.astro`): fill the `[TODO]` markers (date, hosting/mail provider, booking provider, retention) and have it reviewed by a lawyer.
- [ ] Review commitments in the copy: "odpowiedź w ciągu 1 dnia roboczego" (contact, audit, thank-you pages) and audit process wording.
- [ ] Add real, approved testimonials to `src/data/testimonials.ts` (optional; nothing renders until then).
- [ ] Validate JSON-LD on the live URL with Google's Rich Results Test, and rerun Lighthouse on the production host.

## Acceptance checklist (status at hand-off)

- [x] All pages exist and are linked: `/`, `/cennik/`, `/audyt-seo/`, `/case-studies/` (+ detail template), `/o-mnie/`, `/konsultant-seo-wroclaw/` (footer), `/kontakt/`, `/polityka-prywatnosci/` (footer), `404`, plus `/dziekujemy/` (noindex).
- [x] Calculator: totals, audit credit rule, netto/brutto toggle, prefill into the form, keyboard-accessible (native radios/checkboxes/range, labelled stepper, `aria-live` summary). Verified in the browser, e.g. SCALE + audit + strategy + 4 h + 1 250 zł → 9 250 / 8 500 / −2 250 / 15 500 zł netto.
- [x] All prices come from `src/data/pricing.ts`.
- [x] Example case studies show the "Przykładowy scenariusz – do podmiany" badge, are `noindex` and are excluded from the sitemap. No invented testimonials, logos or names.
- [x] Lighthouse mobile (local `astro preview`, Lighthouse 12, simulated throttling): **100 / 100 / 100 / 100** on `/`, `/cennik/`, `/audyt-seo/`, `/kontakt/`, `/o-mnie/`, `/konsultant-seo-wroclaw/`, `/polityka-prywatnosci/`. LCP 1.1–1.5 s, CLS 0, TBT 0 ms. `/case-studies/` scores SEO 69 only because it is deliberately `noindex` while it holds examples. No console errors.
- [x] JSON-LD present and parses on every page, with required fields checked by script. Google Rich Results Test still needs to be run on the live URL.
- [x] Consent banner: nothing from Google loads and no cookies are set before "Akceptuję". Equal-weight buttons.
- [x] README: run, build, deploy, prices, Before launch list.
