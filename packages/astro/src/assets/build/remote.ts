import CachePolicy from 'http-cache-semantics';
import { isRemoteAllowed } from '@astrojs/internal-helpers/remote';
import type { AstroConfig } from '../../types/public/config.js';

type RemoteImageConfig = Pick<AstroConfig['image'], 'remotePatterns' | 'domains'>;

export type RemoteCacheEntry = {
	data?: string;
	expires: number;
	etag?: string;
	lastModified?: string;
};

/**
 * Recursively follows redirects, validating that the final URL matches allowed patterns.
 * @param url - URL to fetch
 * @param fetchFn - Fetch function
 * @param imageConfig - Image config with allowed domains and patterns
 * @param redirectLimit - Maximum number of redirects to follow (default: 10)
 */
async function fetchWithRedirectValidation(
	url: string,
	fetchFn: typeof fetch,
	imageConfig: RemoteImageConfig,
	redirectLimit: number = 10,
): Promise<Response> {
	if (redirectLimit <= 0) {
		throw new Error('Maximum redirect depth exceeded');
	}

	const req = new Request(url);
	const res = await fetchFn(req, {
		redirect: 'manual',
	});

	// Handle redirects (301, 302, 303, 307, 308 are actual redirects, not 304 Not Modified)
	if ([301, 302, 303, 307, 308].includes(res.status)) {
		const location = res.headers.get('Location');
		if (!location) {
			throw new Error(`Redirect response ${res.status} missing Location header`);
		}

		// Resolve the redirect URL relative to the current URL
		const redirectUrl = new URL(location, url).toString();

		// Validate that the redirect target matches allowed patterns
		if (!isRemoteAllowed(redirectUrl, { domains: imageConfig.domains ?? [], remotePatterns: imageConfig.remotePatterns ?? [] })) {
			throw new Error(
				`The image at ${url} redirected to ${redirectUrl}, which is not an allowed remote location.`,
			);
		}

		// Recursively follow the redirect
		return fetchWithRedirectValidation(redirectUrl, fetchFn, imageConfig, redirectLimit - 1);
	}

	return res;
}

export async function loadRemoteImage(
	src: string,
	fetchFn: typeof fetch = globalThis.fetch,
	imageConfig: RemoteImageConfig = { remotePatterns: [], domains: [] },
) {
	const res = await fetchWithRedirectValidation(src, fetchFn, imageConfig);

	if (!res.ok) {
		throw new Error(
			`Failed to load remote image ${src}. The request did not return a 200 OK response. (received ${res.status}))`,
		);
	}

	// calculate an expiration date based on the response's TTL
	const req = new Request(src);
	const policy = new CachePolicy(webToCachePolicyRequest(req), webToCachePolicyResponse(res));
	const expires = policy.storable() ? policy.timeToLive() : 0;

	return {
		data: Buffer.from(await res.arrayBuffer()),
		expires: Date.now() + expires,
		etag: res.headers.get('Etag') ?? undefined,
		lastModified: res.headers.get('Last-Modified') ?? undefined,
	};
}

/**
 * Revalidate a cached remote asset using its entity-tag or modified date.
 * Uses the [If-None-Match](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match) and [If-Modified-Since](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since)
 * headers to check with the remote server if the cached version of a remote asset is still up to date.
 * The remote server may respond that the cached asset is still up-to-date if the entity-tag or modification time matches (304 Not Modified), or respond with an updated asset (200 OK)
 * @param src - url to remote asset
 * @param revalidationData - an object containing the stored Entity-Tag of the cached asset and/or the Last Modified time
 * @returns An object containing the refreshed expiry time and cache headers. `data` will be a `Buffer` of the new image if the asset was modified (200 OK), or `null` if the cached version is still valid (304 Not Modified).
 */
export async function revalidateRemoteImage(
	src: string,
	revalidationData: { etag?: string; lastModified?: string },
	fetchFn: typeof fetch = globalThis.fetch,
	imageConfig: RemoteImageConfig = { remotePatterns: [], domains: [] },
) {
	const headers = {
		...(revalidationData.etag && { 'If-None-Match': revalidationData.etag }),
		...(revalidationData.lastModified && { 'If-Modified-Since': revalidationData.lastModified }),
	};
	const req = new Request(src, { headers, cache: 'no-cache' });
	const res = await fetchWithRedirectValidation(src, fetchFn, imageConfig);

	// Allow 304 Not Modified: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304
	if (!res.ok && res.status !== 304) {
		throw new Error(
			`Failed to revalidate cached remote image ${src}. The request did not return a 200 OK / 304 NOT MODIFIED response. (received ${res.status} ${res.statusText})`,
		);
	}

	const data = Buffer.from(await res.arrayBuffer());

	if (res.ok && !data.length) {
		// Server did not include body but indicated cache was stale
		return await loadRemoteImage(src, fetchFn, imageConfig);
	}

	// calculate an expiration date based on the response's TTL
	const policy = new CachePolicy(
		webToCachePolicyRequest(req),
		webToCachePolicyResponse(
			res.ok ? res : new Response(null, { status: 200, headers: res.headers }),
		), // 304 responses are not cacheable, so just use its headers to get the refreshed TTL
	);
	const expires = policy.storable() ? policy.timeToLive() : 0;

	return {
		data: res.ok ? data : null,
		expires: Date.now() + expires,
		// While servers should respond with the same headers as a 200 response, if they don't we should reuse the stored value
		etag: res.headers.get('Etag') ?? (res.ok ? undefined : revalidationData.etag),
		lastModified:
			res.headers.get('Last-Modified') ?? (res.ok ? undefined : revalidationData.lastModified),
	};
}

function webToCachePolicyRequest({ url, method, headers }: Request): CachePolicy.Request {
	return {
		method,
		url,
		headers: Object.fromEntries(headers.entries()),
	};
}

function webToCachePolicyResponse({ status, headers }: Response): CachePolicy.Response {
	return {
		status,
		headers: Object.fromEntries(headers.entries()),
	};
}
