/** Construct sitemap.xml given a set of URLs */
export function generateSitemap(pages: string[]): string {
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  pages.sort((a, b) => a.localeCompare(b, 'en', { numeric: true })); // sort alphabetically
  for (const page of pages) {
    sitemap += `<url><loc>${page}</loc></url>`;
  }
  sitemap += `</urlset>\n`;
  return sitemap;
}
