import type { CacheProviderFactory } from 'astro';
import {
	buildCacheControlDirectives,
	collectInvalidationTags,
	pathTag,
	setConditionalHeaders,
} from 'astro/cache/provider-utils';

const factory: CacheProviderFactory = () => {
	return {
		name: 'cloudflare',

		setHeaders(options, request) {
			const headers = new Headers();

			// Cloudflare-CDN-Cache-Control (Cloudflare-specific, highest priority).
			// The adapter's request handler sets `no-store` on responses with no
			// cache intent, so we only emit this header when there is something
			// cacheable to announce.
			const directives = buildCacheControlDirectives(options, ['public']);
			if (directives) {
				headers.set('Cloudflare-CDN-Cache-Control', directives);
			}

			// Auto-tag with the request path for path-based invalidation via tag purge.
			const tags = [...(options.tags ?? [])];
			const { pathname } = new URL(request.url);
			tags.push(pathTag(pathname));

			headers.set('Cache-Tag', tags.join(','));

			setConditionalHeaders(headers, options);

			return headers;
		},

		async invalidate(options) {
			// Imported lazily: a top-level `cloudflare:workers` import in this module
			// breaks the `prerenderEnvironment: 'node'` build, where the provider is
			// loaded by Node during prerendering and the `cloudflare:` scheme is rejected.
			const { cache } = await import('cloudflare:workers');
			const tags = collectInvalidationTags(options);
			if (tags.length > 0) {
				await cache.purge({ tags });
			}
		},
	};
};

export default factory;
