import type { SitemapOptions } from './index.js';

export const SITEMAP_CONFIG_DEFAULTS = {
	filenameBase: 'sitemap',
	entryLimit: 45000,
	namespaces: {
		news: true,
		xhtml: true,
		image: true,
		video: true,
	},
} satisfies SitemapOptions;
