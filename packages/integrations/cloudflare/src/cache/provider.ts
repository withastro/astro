import { env } from 'cloudflare:workers';
import type { CacheProviderFactory } from 'astro';
import {
	buildCacheControlDirectives,
	collectInvalidationTags,
	pathTag,
	setConditionalHeaders,
} from 'astro/cache/provider-utils';
// TODO: replace with `import { cache } from 'cloudflare:workers'` when available
import { getWorkerCache } from './context.js';

/**
 * Read the current Worker version id from the standard `CF_VERSION_METADATA`
 * binding, if the user has configured one. Returns `undefined` otherwise.
 *
 * Responses are tagged with the version that produced them so a deploy or
 * rollback can invalidate only the entries written by a specific version.
 * https://developers.cloudflare.com/workers/cache/purge/#version-specific-purging
 */
function getVersionId(): string | undefined {
	const metadata = (env as Record<string, unknown>).CF_VERSION_METADATA;
	if (metadata && typeof metadata === 'object' && 'id' in metadata) {
		const id = (metadata as { id: unknown }).id;
		if (typeof id === 'string' && id.length > 0) {
			return id;
		}
	}
	return undefined;
}

const VERSION_TAG_PREFIX = 'astro-version:';

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

			// If the user has configured the `CF_VERSION_METADATA` binding, tag
			// responses with the Worker version that produced them.
			const versionId = getVersionId();
			if (versionId) {
				tags.push(`${VERSION_TAG_PREFIX}${versionId}`);
			}

			headers.set('Cache-Tag', tags.join(','));

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

			const tags = collectInvalidationTags(options);
			if (tags.length > 0) {
				await cache.purge({ tags });
			}
		},
	};
};

export default factory;
