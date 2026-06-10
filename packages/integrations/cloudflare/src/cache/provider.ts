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

/**
 * Build a deploy-aware weak `ETag`.
 *
 * Cache hints typically carry only `lastModified` (and route rules carry no
 * validator at all), so by default the strongest validator a page exposes
 * reflects *content* but never the *build*. A code-only deploy can change the
 * rendered output — most commonly the hashed asset URLs (`/_astro/<hash>.css`)
 * embedded in HTML — without changing `lastModified`. Conditional revalidation
 * then resolves to `304 Not Modified`, so clients keep serving HTML that
 * references assets from the previous deployment.
 *
 * Folding the Worker version id into the validator makes it change on a
 * redeploy as well as on a content edit (via `lastModified`). Because
 * `If-None-Match` takes precedence over `If-Modified-Since`, a redeploy now
 * produces a fresh `200`. The validator is weak (`W/`) because the response is
 * only guaranteed to be *semantically* equivalent for a given version, not
 * byte-for-byte (e.g. timestamps or nonces rendered into the body).
 */
function versionedEtag(versionId: string, lastModified: Date | undefined): string {
	const contentPart = lastModified ? `:${lastModified.getTime()}` : '';
	return `W/"${versionId}${contentPart}"`;
}

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

			// Default to a deploy-aware validator so conditional revalidation
			// returns a fresh `200` after a redeploy, even when the content
			// (`lastModified`) is unchanged. An explicitly provided `etag` is
			// always respected — the user is taking control of the validator.
			const conditionalOptions =
				versionId !== undefined && options.etag === undefined
					? { ...options, etag: versionedEtag(versionId, options.lastModified) }
					: options;

			setConditionalHeaders(headers, conditionalOptions);

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
