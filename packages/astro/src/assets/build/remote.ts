import CachePolicy from 'http-cache-semantics';

export type RemoteCacheEntry = { data: string; expires: number };

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
