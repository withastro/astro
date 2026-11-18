import type { CacheProviderFactory } from 'astro';
import {
	buildCacheControlDirectives,
	collectInvalidationTags,
	pathTag,
	setConditionalHeaders,
} from 'astro/cache/provider-utils';

const factory: CacheProviderFactory = () => {
	return {
		name: 'netlify',

		setHeaders(options, request) {
			const headers = new Headers();

			// Netlify-CDN-Cache-Control (Netlify-specific, highest priority)
			// Includes `public` and `durable` for Netlify's shared durable cache.
			// https://docs.netlify.com/platform/caching/#durable-directive
			const directives = buildCacheControlDirectives(options, ['public', 'durable']);
			if (directives) {
				headers.set('Netlify-CDN-Cache-Control', directives);
			}

			// Auto-tag with the request path for path-based invalidation
			const tags = [...(options.tags ?? [])];
			const { pathname } = new URL(request.url);
			tags.push(pathTag(pathname));

			headers.set('Netlify-Cache-Tag', tags.join(','));

			setConditionalHeaders(headers, options);

			return headers;
		},

		async invalidate(options) {
			const { purgeCache } = await import('@netlify/functions');
			const tags = collectInvalidationTags(options);
			if (tags.length > 0) {
				await purgeCache({ tags });
			}
		},
	};
};

export default factory;
