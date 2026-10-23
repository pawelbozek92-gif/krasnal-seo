/**
 * Prefixes a root-relative path with the site's base path (Astro `base`),
 * so URLs built in scripts also work when the site is served from a sub-folder
 * (e.g. the GitHub Pages preview). On the production domain the base is "/".
 */
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

export const withBase = (path: string) => (path.startsWith('/') && !path.startsWith('//') ? `${BASE}${path}` : path);
