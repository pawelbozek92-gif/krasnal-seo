// Static checks on the built site (no browser needed). Run after `npm run build`:
//   npm run check:dist
// Fails (exit 1) on errors; prints warnings for things worth a look.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

if (!existsSync(DIST)) {
  console.error('dist/ not found – run `npm run build` first.');
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const files = walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));

// Sitemap URLs
const sitemapUrls = files
  .filter((f) => /sitemap-\d+\.xml$/.test(f))
  .flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname));

const titles = new Map();
let todoPages = 0;

for (const file of htmlFiles) {
  const rel = relative(DIST, file).replace(/\\/g, '/');
  const html = readFileSync(file, 'utf8');
  const route = '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '/');

  if (!/<html lang="pl"/.test(html)) err(rel, 'missing <html lang="pl">');

  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) err(rel, `expected exactly one <h1>, found ${h1}`);

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  if (!title) err(rel, 'missing <title>');
  else if (title.length > 65) warn(rel, `title is ${title.length} chars (aim for ≤ 60–65)`);
  if (titles.has(title)) err(rel, `duplicate title with ${titles.get(title)}`);
  titles.set(title, rel);

  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  if (desc.length < 50) err(rel, 'meta description missing or too short');
  else if (desc.length > 165) warn(rel, `meta description is ${desc.length} chars`);

  if (!/<link rel="canonical" href="https:\/\/[^"]+"/.test(html)) err(rel, 'missing absolute canonical');
  if (!/property="og:image"/.test(html)) err(rel, 'missing og:image');

  // Images: alt + explicit dimensions
  for (const img of html.match(/<img\b[^>]*>/g) || []) {
    // Astro may emit decorative images as a bare `alt` attribute.
    if (!/\balt(=|[\s>/])/.test(img)) err(rel, `<img> without alt: ${img.slice(0, 80)}`);
    if (!/\bwidth=/.test(img) || !/\bheight=/.test(img)) err(rel, `<img> without width/height: ${img.slice(0, 80)}`);
  }

  // JSON-LD must parse
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      err(rel, `invalid JSON-LD: ${e.message}`);
    }
  }

  // Indexing consistency
  const noindex = /<meta name="robots" content="noindex/.test(html);
  const inSitemap = sitemapUrls.includes(route);
  if (noindex && inSitemap) err(rel, 'noindex page is listed in the sitemap');
  if (!noindex && !inSitemap && rel !== '404.html') err(rel, 'indexable page missing from the sitemap');

  // Example case studies must be flagged
  if (rel.startsWith('case-studies/') && html.includes('badge--example') && !noindex) err(rel, 'example case study without noindex');

  // Placeholders left in the page (expected until launch)
  if (/\[TODO[^\]]*\]/.test(html)) todoPages++;

  // Internal links point to existing pages
  for (const [, href] of html.matchAll(/<a\b[^>]*href="(\/[^"#?]*)/g)) {
    const target = href.endsWith('/') ? join(DIST, href, 'index.html') : join(DIST, href);
    if (!existsSync(target)) err(rel, `broken internal link ${href}`);
  }
}

// Page weight budget (HTML incl. inlined CSS)
for (const f of htmlFiles) {
  const kb = statSync(f).size / 1024;
  if (kb > 120) warn(relative(DIST, f), `HTML is ${kb.toFixed(0)} kB`);
}
const jsKb = files.filter((f) => f.endsWith('.js')).reduce((s, f) => s + statSync(f).size, 0) / 1024;
if (jsKb > 50) warn('_astro', `total JS is ${jsKb.toFixed(1)} kB (budget 50 kB)`);

if (todoPages) warnings.push(`${todoPages} page(s) still show visible [TODO] placeholders – fill src/config/site.ts before launch`);
for (const w of warnings) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✖ ${e}`);
console.log(`\nchecked ${htmlFiles.length} pages, JS total ${jsKb.toFixed(1)} kB: ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
