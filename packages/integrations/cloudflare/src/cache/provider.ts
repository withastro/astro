import type { CacheProviderFactory } from 'astro';
import {
	buildCacheControlDirectives,
	collectInvalidationTags,
	pathTag,
	setConditionalHeaders,
} from 'astro/cache/provider-utils';

const VERSION_TAG_PREFIX = 'astro-version:';

/**
 * Read the Worker version id from the `CF_VERSION_METADATA` binding.
 *
 * A top-level `cloudflare:workers` import breaks the `prerenderEnvironment:
 * 'node'` build, so the module is imported dynamically. Full explanation:
 * https://github.com/withastro/astro/pull/16335. Resolving once at module
 * load keeps `setHeaders()` synchronous.
 */
async function readVersionId(): Promise<string | undefined> {
	try {
		const { env } = await import('cloudflare:workers');
		const metadata = (env as Record<string, unknown>).CF_VERSION_METADATA;
		if (metadata && typeof metadata === 'object' && 'id' in metadata) {
			const id = (metadata as { id: unknown }).id;
			if (typeof id === 'string' && id.length > 0) {
				return id;
			}
		}
	} catch {
		// No Workers runtime, or no binding configured.
	}
	return undefined;
}

const versionId = await readVersionId();

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

			if (versionId) {
				tags.push(`${VERSION_TAG_PREFIX}${versionId}`);
			}

			headers.set('Cache-Tag', tags.join(','));

			setConditionalHeaders(headers, options);

			// The validator stays weak: two responses from one version are
			// semantically equivalent, not byte-identical. Dropping the `lastModified`
			// condition would mint a validator where none existed, which lets a cache
			// answer `304` for a page whose content changes between deploys.
			if (versionId && options.lastModified && !options.etag) {
				headers.set('ETag', `W/"${versionId}:${options.lastModified.getTime()}"`);
			}

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
