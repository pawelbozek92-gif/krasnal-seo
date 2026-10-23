// Prefixes root-relative URLs in dist/ with SITE_BASE so the site works from a sub-folder
// (GitHub Pages: https://<user>.github.io/<repo>/). Not needed on the production domain.
//   SITE_BASE=/krasnal-seo node scripts/rebase-dist.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const base = (process.env.SITE_BASE || '').replace(/\/$/, '');
if (!base) {
  console.log('SITE_BASE not set – nothing to do.');
  process.exit(0);
}
const esc = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// A root-relative path that is not protocol-relative and not already prefixed.
const ROOT = `/(?!/|${esc.slice(1)}/)`;

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
let changed = 0;
for (const file of walk('dist')) {
  if (!/\.(html|css)$/.test(file)) continue;
  const before = readFileSync(file, 'utf8');
  const after = before
    .replace(new RegExp(`\\b(href|src|action|poster)=(["'])${ROOT}`, 'g'), `$1=$2${base}/`)
    .replace(new RegExp(`url\\((["']?)${ROOT}`, 'g'), `url($1${base}/`);
  if (after !== before) {
    writeFileSync(file, after);
    changed++;
  }
}
console.log(`rebased ${changed} file(s) to ${base}/`);
