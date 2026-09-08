import type { SitemapItem } from '../index.js';

/**
 * Returns the most recent `lastmod` among the given sitemap items as an
 * ISO 8601 string, or `undefined` when none of them carry a valid `lastmod`.
 *
 * Used to stamp each `<sitemap>` entry in the sitemap index with the freshest
 * date present in the child sitemap it points to, so search engines can tell
 * which child sitemaps actually changed without refetching all of them.
 */
export function getLatestLastmod(items: SitemapItem[]): string | undefined {
	let latest: number | undefined;
	for (const item of items) {
		if (!item.lastmod) continue;
		const time = new Date(item.lastmod).getTime();
		if (Number.isNaN(time)) continue;
		if (latest === undefined || time > latest) {
			latest = time;
		}
	}
	return latest === undefined ? undefined : new Date(latest).toISOString();
}
