import CachePolicy from 'http-cache-semantics';
import { fetchWithRedirects } from '../utils/redirectValidation.js';
async function loadRemoteImage(
	src,
	fetchFn = globalThis.fetch,
	imageConfig = { remotePatterns: [], domains: [] },
) {
	const res = await fetchWithRedirects({
		url: src,
		fetchFn,
		imageConfig,
	});
	if (!res.ok) {
		throw new Error(
			`Failed to load remote image ${src}. The request did not return a 200 OK response. (received ${res.status}))`,
		);
	}
	const req = new Request(src);
	const policy = new CachePolicy(webToCachePolicyRequest(req), webToCachePolicyResponse(res));
	const expires = policy.storable() ? policy.timeToLive() : 0;
	return {
		data: Buffer.from(await res.arrayBuffer()),
		expires: Date.now() + expires,
		etag: res.headers.get('Etag') ?? void 0,
		lastModified: res.headers.get('Last-Modified') ?? void 0,
	};
}
async function revalidateRemoteImage(
	src,
	revalidationData,
	fetchFn = globalThis.fetch,
	imageConfig = { remotePatterns: [], domains: [] },
) {
	const headers = {
		...(revalidationData.etag && { 'If-None-Match': revalidationData.etag }),
		...(revalidationData.lastModified && { 'If-Modified-Since': revalidationData.lastModified }),
	};
	const req = new Request(src, { headers, cache: 'no-cache' });
	const res = await fetchWithRedirects({
		url: src,
		headers: new Headers(headers),
		imageConfig,
		fetchFn,
	});
	if (!res.ok && res.status !== 304) {
		if (res.status >= 300 && res.status < 400) {
			throw new Error(
				`Failed to revalidate cached remote image ${src}. The request was redirected.`,
			);
		}
		throw new Error(
			`Failed to revalidate cached remote image ${src}. The request did not return a 200 OK / 304 NOT MODIFIED response. (received ${res.status} ${res.statusText})`,
		);
	}
	const data = Buffer.from(await res.arrayBuffer());
	if (res.ok && !data.length) {
		return await loadRemoteImage(src, fetchFn, imageConfig);
	}
	const policy = new CachePolicy(
		webToCachePolicyRequest(req),
		webToCachePolicyResponse(
			res.ok ? res : new Response(null, { status: 200, headers: res.headers }),
		),
		// 304 responses are not cacheable, so just use its headers to get the refreshed TTL
	);
	const expires = policy.storable() ? policy.timeToLive() : 0;
	return {
		data: res.ok ? data : null,
		expires: Date.now() + expires,
		// While servers should respond with the same headers as a 200 response, if they don't we should reuse the stored value
		etag: res.headers.get('Etag') ?? (res.ok ? void 0 : revalidationData.etag),
		lastModified:
			res.headers.get('Last-Modified') ?? (res.ok ? void 0 : revalidationData.lastModified),
	};
}
function webToCachePolicyRequest({ url, method, headers }) {
	return {
		method,
		url,
		headers: Object.fromEntries(headers.entries()),
	};
}
function webToCachePolicyResponse({ status, headers }) {
	return {
		status,
		headers: Object.fromEntries(headers.entries()),
	};
}
export { loadRemoteImage, revalidateRemoteImage };
