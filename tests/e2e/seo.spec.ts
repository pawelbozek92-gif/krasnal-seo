import { expect, test } from '@playwright/test';
import { allPages, indexablePages } from './helpers';
import { site } from '../../src/config/site';
import { caseStudies } from '../../src/data/case-studies';
import { packages } from '../../src/data/pricing';

const exampleSlugs = caseStudies.filter((c) => c.isExample).map((c) => c.slug);

async function html(request: import('@playwright/test').APIRequestContext, path: string) {
  const res = await request.get(path);
  expect(res.status(), path).toBe(200);
  return res.text();
}

function jsonLdTypes(source: string) {
  const types: string[] = [];
  const nodes: any[] = [];
  for (const m of source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const data = JSON.parse(m[1]);
    for (const n of data['@graph'] ?? [data]) {
      types.push(n['@type']);
      nodes.push(n);
    }
  }
  return { types, nodes };
}

test('robots.txt allows crawling and points to the sitemap', async ({ request }) => {
  const txt = await html(request, '/robots.txt');
  expect(txt).toContain('User-agent: *');
  expect(txt).toContain(`Sitemap: ${site.url}/sitemap-index.xml`);
});

test('sitemap lists indexable pages only', async ({ request }) => {
  const index = await html(request, '/sitemap-index.xml');
  const sitemaps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const locs: string[] = [];
  for (const s of sitemaps) {
    const xml = await html(request, s);
    locs.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname));
  }
  for (const p of indexablePages) expect(locs, p).toContain(p);
  for (const slug of exampleSlugs) expect(locs).not.toContain(`/case-studies/${slug}/`);
  expect(locs).not.toContain('/dziekujemy/');
  expect(locs.some((l) => l.includes('404'))).toBe(false);
});

test('noindex is set exactly where intended', async ({ request }) => {
  for (const path of allPages) {
    const source = await html(request, path);
    const noindex = /<meta name="robots" content="noindex/.test(source);
    const shouldBeNoindex =
      path === '/dziekujemy/' ||
      exampleSlugs.some((s) => path === `/case-studies/${s}/`) ||
      (path === '/case-studies/' && caseStudies.every((c) => c.isExample));
    expect(noindex, path).toBe(shouldBeNoindex);
  }
});

test('example case studies show the replacement badge', async ({ request }) => {
  for (const slug of exampleSlugs) {
    expect(await html(request, `/case-studies/${slug}/`)).toContain('Przykładowy scenariusz – do podmiany');
  }
});

test('every page has Open Graph and Twitter tags', async ({ request }) => {
  for (const path of allPages) {
    const source = await html(request, path);
    for (const tag of ['og:title', 'og:description', 'og:image', 'og:url']) expect(source, `${path} ${tag}`).toContain(`property="${tag}"`);
    expect(source, path).toContain('name="twitter:card" content="summary_large_image"');
  }
});

test('titles are unique across the site', async ({ request }) => {
  const titles = new Map<string, string>();
  for (const path of allPages) {
    const title = (await html(request, path)).match(/<title>([^<]*)<\/title>/)![1];
    expect(titles.has(title), `${path} duplicates ${titles.get(title)}`).toBe(false);
    titles.set(title, path);
  }
});

const expectedSchema: Record<string, string[]> = {
  '/': ['ProfessionalService', 'FAQPage', 'Service'],
  '/cennik/': ['ProfessionalService', 'BreadcrumbList', 'Service', 'FAQPage'],
  '/audyt-seo/': ['ProfessionalService', 'BreadcrumbList', 'Service', 'FAQPage'],
  '/o-mnie/': ['ProfessionalService', 'BreadcrumbList', 'Person'],
  '/konsultant-seo-wroclaw/': ['ProfessionalService', 'BreadcrumbList', 'Service', 'FAQPage'],
  '/kontakt/': ['ProfessionalService', 'BreadcrumbList'],
};

for (const [path, types] of Object.entries(expectedSchema)) {
  test(`JSON-LD on ${path} is valid and complete`, async ({ request }) => {
    const { types: found, nodes } = jsonLdTypes(await html(request, path));
    for (const t of types) expect(found, t).toContain(t);

    for (const n of nodes) {
      if (n['@type'] === 'FAQPage') {
        expect(n.mainEntity.length).toBeGreaterThan(0);
        for (const q of n.mainEntity) expect(q.name && q.acceptedAnswer?.text).toBeTruthy();
      }
      if (n['@type'] === 'BreadcrumbList') {
        n.itemListElement.forEach((item: any, i: number) => {
          expect(item.position).toBe(i + 1);
          expect(item.item).toMatch(new RegExp(`^${site.url}/`));
        });
      }
      if (n['@type'] === 'Service' && n.offers) {
        expect(n.offers.priceCurrency).toBe('PLN');
        expect(Number(n.offers.price)).toBeGreaterThan(0);
      }
      if (n['@type'] === 'ProfessionalService') {
        expect(n.address.addressLocality).toBe(site.address.city);
        expect(n.areaServed.name).toBe('Polska');
        expect(JSON.stringify(n)).not.toContain('TODO');
      }
    }
  });
}

test('package offers in JSON-LD match pricing.ts', async ({ request }) => {
  const { nodes } = jsonLdTypes(await html(request, '/cennik/'));
  for (const p of packages) {
    const service = nodes.find((n) => n['@type'] === 'Service' && n.name.endsWith(p.name));
    expect(service, p.name).toBeTruthy();
    expect(Number(service.offers.price)).toBe(p.priceNet);
  }
});
