import type { CacheProviderFactory } from 'astro';
import {
	buildCacheControlDirectives,
	normalizeTags,
	setConditionalHeaders,
} from 'astro/cache/provider-utils';
// TODO: replace with `import { cache } from 'cloudflare:workers'` when available
import { getWorkerCache } from './context.js';

const factory: CacheProviderFactory = () => {
	return {
		name: 'cloudflare',

		setHeaders(options, _request) {
			const headers = new Headers();

			// Cloudflare-CDN-Cache-Control (Cloudflare-specific, highest priority)
			const directives = buildCacheControlDirectives(options, ['public']);
			if (directives) {
				headers.set('Cloudflare-CDN-Cache-Control', directives);
			}

			// Cache-Tag for tag-based purging
			const tags = [...(options.tags ?? [])];
			if (tags.length > 0) {
				headers.set('Cache-Tag', tags.join(','));
			}

			setConditionalHeaders(headers, options);

			return headers;
		},

		async invalidate(options) {
			// TODO: replace with `import { cache } from 'cloudflare:workers'` when available
			const cache = getWorkerCache();
			if (!cache) {
				throw new Error(
					'Worker cache is not available. Ensure caching is enabled in your Worker config.',
				);
			}

			// Cloudflare supports native path prefix purge
			if (options.path) {
				await cache.purge({ pathPrefixes: [options.path] });
			}

			const tags = normalizeTags(options.tags);
			if (tags.length > 0) {
				await cache.purge({ tags });
			}
		},
	};
};

export default factory;
