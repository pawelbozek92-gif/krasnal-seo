// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { site } from './src/config/site.ts';
import { caseStudies } from './src/data/case-studies.ts';

const exampleSlugs = caseStudies.filter((c) => c.isExample).map((c) => c.slug);
const onlyExamples = caseStudies.every((c) => c.isExample);

// Pages that must never be listed in sitemap.xml.
const excludedPaths = [
  '/404/',
  '/dziekujemy/',
  ...exampleSlugs.map((slug) => `/case-studies/${slug}/`),
  ...(onlyExamples ? ['/case-studies/'] : []),
];

/** Logs a reminder while example case studies are still in the data file. */
const exampleCaseStudyWarning = {
  name: 'example-case-study-warning',
  hooks: {
    'astro:server:start': ({ logger }) => warn(logger),
    'astro:build:done': ({ logger }) => warn(logger),
  },
};
function warn(logger) {
  if (!exampleSlugs.length) return;
  logger.warn(
    `${exampleSlugs.length} example case stud${exampleSlugs.length === 1 ? 'y' : 'ies'} still present ` +
      `(noindex, excluded from sitemap): ${exampleSlugs.join(', ')}. Replace them in src/data/case-studies.ts.`,
  );
}

export default defineConfig({
  site: site.url,
  // Sub-folder hosting (GitHub Pages preview): SITE_BASE=/krasnal-seo, then `node scripts/rebase-dist.mjs`.
  base: process.env.SITE_BASE || undefined,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  compressHTML: true,
  integrations: [
    sitemap({
      filter: (page) => !excludedPaths.some((p) => new URL(page).pathname === p),
    }),
    exampleCaseStudyWarning,
  ],
});
