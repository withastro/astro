import type { InvalidateOptions } from 'astro';
import { normalizeTags } from 'astro/cache/provider-utils';
import type { AppwriteCacheConfig } from './index.js';

/** Appwrite Cloud, used when neither the config nor the runtime names an endpoint. */
const DEFAULT_ENDPOINT = 'https://cloud.appwrite.io/v1';

/**
 * Longest cache key the invalidation API accepts as a `tag` reference. A longer
 * key can be attached to a response but never purged, so it is dropped on both
 * the response path and the purge path instead.
 */
export const CACHE_KEY_MAX_LENGTH = 128;

/**
 * Characters that reach the CDN unchanged. Everything else is percent-encoded,
 * including `%` itself so the encoding stays reversible and a tag always
 * normalizes to the same key on both paths.
 *
 * The edge splits `Appwrite-CDN-Cache-Key` on whitespace and re-joins the keys
 * with commas for the CDN's `Cache-Tag`, so a key containing whitespace would
 * become several keys and a key containing a comma would corrupt the header —
 * in both cases the response ends up tagged with something no purge can name.
 */
const UNSAFE_KEY_CHARS = /[^A-Za-z0-9\-_.:~!$&'()*+;=@/]+/gu;

const warned = new Set<string>();

export class AppwriteCacheError extends Error {
	override name = 'AppwriteCacheError';
}

/**
 * Request-scoped values the invalidation API needs but `invalidate(options)`
 * does not carry: the dynamic API key Appwrite sends with every request, and
 * the domain the response was served on.
 */
export interface RequestScope {
	apiKey?: string;
	domain?: string;
}

export interface AppwriteCredentials {
	endpoint: string;
	projectId: string;
	apiKey: string;
}

/** A single `POST /proxy/invalidations` call. */
export interface Invalidation {
	domain: string;
	type: 'tag' | 'path';
	reference: string;
}

/**
 * Convert an Astro cache tag into an Appwrite cache key. Returns `null` when the
 * tag cannot be represented as one.
 */
export function normalizeCacheKey(tag: string): string | null {
	const key = tag.trim().replace(UNSAFE_KEY_CHARS, percentEncode);

	if (!key) {
		return null;
	}

	if (key.length > CACHE_KEY_MAX_LENGTH) {
		warnOnce(
			`[appwrite] Cache tag ${JSON.stringify(tag)} is longer than ${CACHE_KEY_MAX_LENGTH} characters once encoded and was skipped. Responses are still cached, but this tag cannot be invalidated.`,
		);
		return null;
	}

	return key;
}

/**
 * Normalize Astro cache tags into deduplicated Appwrite cache keys, in the order
 * they were declared.
 */
export function toCacheKeys(tags: readonly string[] | undefined): string[] {
	if (!tags?.length) {
		return [];
	}

	const keys = new Set<string>();
	for (const tag of tags) {
		const key = normalizeCacheKey(tag);
		if (key) {
			keys.add(key);
		}
	}

	return [...keys];
}

/**
 * Expand `cache.invalidate()` options into the invalidations to create.
 *
 * Appwrite purges one cache key or one URL path per call, for one domain, so `n`
 * references across `m` domains is `n * m` calls. Returns an empty list when
 * there is nothing to purge.
 */
export function planInvalidations(
	options: InvalidateOptions,
	domains: readonly string[],
): Invalidation[] {
	const references: Array<Omit<Invalidation, 'domain'>> = [];

	for (const key of toCacheKeys(normalizeTags(options.tags))) {
		references.push({ type: 'tag', reference: key });
	}

	if (options.path) {
		references.push({ type: 'path', reference: normalizePathReference(options.path) });
	}

	return domains.flatMap((domain) => references.map((reference) => ({ domain, ...reference })));
}

/**
 * Reduce a path to what the invalidation API accepts as a `path` reference: an
 * absolute path with no relative segments, no query and no fragment. A full URL
 * is accepted and reduced to its path.
 *
 * A path purge clears the exact URL, so responses cached under the same path
 * with a query string are not covered by it.
 */
export function normalizePathReference(path: string): string {
	// Resolving against a base normalizes `.`/`..` segments, percent-encodes what
	// the API would reject, and drops the query and fragment for free.
	return new URL(path, 'https://astrojs-appwrite.invalid').pathname;
}

/**
 * Resolve the client credentials for an invalidation, preferring explicit config
 * over the request over the runtime environment.
 */
export function resolveCredentials(
	config: AppwriteCacheConfig,
	scope: RequestScope | undefined,
	env: Record<string, string | undefined> = process.env,
): AppwriteCredentials {
	const endpoint =
		config.endpoint ||
		env.APPWRITE_FUNCTION_API_ENDPOINT ||
		env.APPWRITE_SITE_API_ENDPOINT ||
		DEFAULT_ENDPOINT;

	const projectId =
		config.projectId || env.APPWRITE_FUNCTION_PROJECT_ID || env.APPWRITE_SITE_PROJECT_ID;

	// The dynamic key on the request is scoped to this deployment and expires with
	// it, which makes it a better default than a long-lived key in the environment.
	const apiKey = config.apiKey || scope?.apiKey || env.APPWRITE_API_KEY;

	if (!projectId) {
		throw new AppwriteCacheError(
			'Could not determine the Appwrite project to invalidate. Set `APPWRITE_FUNCTION_PROJECT_ID` or pass `projectId` to `cacheAppwrite()`.',
		);
	}

	if (!apiKey) {
		throw new AppwriteCacheError(
			'Could not determine an Appwrite API key to invalidate with. Invalidate from a request so the `x-appwrite-key` header is available, or set `APPWRITE_API_KEY`, or pass `apiKey` to `cacheAppwrite()`. The key needs the `proxy.invalidations.write` scope.',
		);
	}

	return { endpoint, projectId, apiKey };
}

/**
 * Resolve which domains to purge. A purge only clears the domain it names, so a
 * site on several domains has to name each of them.
 */
export function resolveDomains(
	config: AppwriteCacheConfig,
	scope: RequestScope | undefined,
): string[] {
	const configured = config.domain
		? Array.isArray(config.domain)
			? config.domain
			: [config.domain]
		: [];

	const domains = (configured.length > 0 ? configured : [scope?.domain])
		.map((domain) => domain?.trim().toLowerCase())
		.filter((domain): domain is string => Boolean(domain));

	if (domains.length === 0) {
		throw new AppwriteCacheError(
			'Could not determine which Appwrite domain to invalidate. Invalidate from a request, or pass `domain` to `cacheAppwrite()`.',
		);
	}

	return [...new Set(domains)];
}

/** Percent-encode a run of characters as its UTF-8 bytes. */
function percentEncode(run: string): string {
	let encoded = '';
	for (const byte of new TextEncoder().encode(run)) {
		encoded += `%${byte.toString(16).padStart(2, '0').toUpperCase()}`;
	}
	return encoded;
}

function warnOnce(message: string): void {
	if (warned.has(message)) {
		return;
	}
	warned.add(message);
	console.warn(message);
}
