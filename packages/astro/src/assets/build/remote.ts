import CachePolicy from 'http-cache-semantics';

export type RemoteCacheEntry = { data: string; expires: number; etag?: string };

export async function loadRemoteImage(src: string) {
	const req = new Request(src);
	const res = await fetch(req);

	if (!res.ok) {
		throw new Error(
			`Failed to load remote image ${src}. The request did not return a 200 OK response. (received ${res.status}))`,
		);
	}

	// calculate an expiration date based on the response's TTL
	const policy = new CachePolicy(webToCachePolicyRequest(req), webToCachePolicyResponse(res));
	const expires = policy.storable() ? policy.timeToLive() : 0;

	return {
		data: Buffer.from(await res.arrayBuffer()),
		expires: Date.now() + expires,
		etag: res.headers.get('Etag'),
	};
}

export async function revalidateRemoteImage(src: string, etag: string) {
	const req = new Request(src, { headers: { 'If-None-Match': etag } });
	const res = await fetch(req);

	if (!res.ok && res.status != 304) {
		throw new Error(
			`Failed to revalidate cached remote image ${src}. The request did not return a 200 OK / 304 NOT MODIFIED response. (received ${res.status}))`,
		);
	}

	const data = Buffer.from(await res.arrayBuffer());

	if (res.ok && !data.length) {
		// Server did not include body but indicated cache was stale
		return await loadRemoteImage(src);
	}

	// calculate an expiration date based on the response's TTL
	const policy = new CachePolicy(
		webToCachePolicyRequest(req),
		webToCachePolicyResponse(
			res.ok ? res : new Response(null, { status: 200, headers: res.headers }),
		), // 304 responses themselves are not cachable, so just pretend to get the refreshed TTL
	);
	const expires = policy.storable() ? policy.timeToLive() : 0;

	return {
		data,
		expires: Date.now() + expires,
		etag: res.headers.get('Etag'),
	};
}

function webToCachePolicyRequest({ url, method, headers: _headers }: Request): CachePolicy.Request {
	let headers: CachePolicy.Headers = {};
	// Be defensive here due to a cookie header bug in node@18.14.1 + undici
	try {
		headers = Object.fromEntries(_headers.entries());
	} catch {}
	return {
		method,
		url,
		headers,
	};
}

function webToCachePolicyResponse({ status, headers: _headers }: Response): CachePolicy.Response {
	let headers: CachePolicy.Headers = {};
	// Be defensive here due to a cookie header bug in node@18.14.1 + undici
	try {
		headers = Object.fromEntries(_headers.entries());
	} catch {}
	return {
		status,
		headers,
	};
}
