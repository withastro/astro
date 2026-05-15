import type { SitemapItem, SitemapOptions } from './index.js';
/** Construct sitemap.xml given a set of URLs */
export declare function generateSitemap(
	pages: string[],
	finalSiteUrl: string,
	opts?: SitemapOptions,
): SitemapItem[];
