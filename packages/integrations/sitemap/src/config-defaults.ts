// organize-imports-ignore there's a bug where it strips out this import
import type { SitemapOptions } from './index.js';

export const SITEMAP_CONFIG_DEFAULTS = {
	entryLimit: 45000,
} satisfies SitemapOptions;
