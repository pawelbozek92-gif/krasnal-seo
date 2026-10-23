import type { APIRoute } from 'astro';

// Preview deployments (PREVIEW_NOINDEX=1, e.g. GitHub Pages) block all crawling.
const lines = (site: URL | undefined) =>
  process.env.PREVIEW_NOINDEX
    ? ['# Preview deployment – not for indexing', 'User-agent: *', 'Disallow: /', '']
    : ['User-agent: *', 'Allow: /', 'Disallow: /api/', '', `Sitemap: ${new URL('sitemap-index.xml', site).href}`, ''];

export const GET: APIRoute = ({ site }) =>
  new Response(lines(site).join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
