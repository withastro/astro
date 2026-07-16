import type { CacheProviderFactory } from 'astro';
import { getRequestURL } from 'astro/app';
import {
	buildCacheControlDirectives,
	collectInvalidationTags,
	pathTag,
	setConditionalHeaders,
} from 'astro/cache/provider-utils';

const factory: CacheProviderFactory = () => {
	return {
		name: 'vercel',

		setHeaders(options, request) {
			const headers = new Headers();

			// Vercel-CDN-Cache-Control (Vercel-specific, highest priority)
			const directives = buildCacheControlDirectives(options, ['public']);
			if (directives) {
				headers.set('Vercel-CDN-Cache-Control', directives);
			}

			// Auto-tag with the request path for path-based invalidation
			const tags = [...(options.tags ?? [])];
			const { pathname } = getRequestURL(request);
			tags.push(pathTag(pathname));

			headers.set('Vercel-Cache-Tag', tags.join(','));

			setConditionalHeaders(headers, options);

			return headers;
		},

		async invalidate(options) {
			const { invalidateByTag } = await import('@vercel/functions');
			const tags = collectInvalidationTags(options);
			await Promise.all(tags.map((tag) => invalidateByTag(tag)));
		},
	};
};

export default factory;
