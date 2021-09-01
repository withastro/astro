import type { BuildOutput } from '../@types/astro';
import { canonicalURL } from './util.js';

/** Construct sitemap.xml given a set of URLs */
export function generateSitemap(buildState: BuildOutput, site: string): string {
  const uniqueURLs = new Set<string>();

  // TODO: find way to respect <link rel="canonical"> URLs here
  // TODO: find way to exclude pages from sitemap (currently only skips 404 pages)

  // look through built pages, only add HTML
  for (const id of Object.keys(buildState)) {
    if (buildState[id].contentType !== 'text/html') continue;
    if (id === '/404.html') continue;
    uniqueURLs.add(canonicalURL(id, site).href);
  }

  const pages = [...uniqueURLs];
  pages.sort((a, b) => a.localeCompare(b, 'en', { numeric: true })); // sort alphabetically so sitemap is same each time

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  for (const page of pages) {
    sitemap += `<url><loc>${page}</loc></url>`;
  }
  sitemap += `</urlset>\n`;
  return sitemap;
}
