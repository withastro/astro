export interface PageMeta {
  /** (required) The canonical URL of the page */
  canonicalURL: string;
  /** Updated date (default: now) */
  lastmod?: Date;
}

/** Format Sitemap Date */
function formatDate(date: Date): string {
  return date.toISOString().replace(/T.*/, '');
}

/** Construct sitemap.xml given a set of URLs */
export function generateSitemap(pages: PageMeta[]): string {
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  pages.sort((a, b) => a.canonicalURL.localeCompare(b.canonicalURL, 'en', { numeric: true })); // sort alphabetically
  for (const page of pages) {
    sitemap += `<url><loc>${page.canonicalURL}</loc><lastmod>${formatDate(page.lastmod || new Date())}</lastmod></url>`;
  }
  sitemap += `</urlset>\n`;
  return sitemap;
}
