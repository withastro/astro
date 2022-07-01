import type { SitemapOptions } from './index.js';
import { SitemapOptionsSchema } from './schema.js';

// @internal
export const validateOptions = (opts: SitemapOptions) => {
	const result = SitemapOptionsSchema.parse(opts);
	return result;
};
