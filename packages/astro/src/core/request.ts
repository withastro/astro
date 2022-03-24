import type { IncomingHttpHeaders } from 'http';

type HeaderType = Headers | Record<string, any> | IncomingHttpHeaders;

export function createRequest(url: URL | string, headers: HeaderType, method: string = 'GET'): Request {
	let headersObj = headers instanceof Headers ? headers :
		new Headers(Object.entries(headers as Record<string, any>));
	
	const request = new Request(url.toString(), {
		method: method,
		headers: headersObj
	});

	Object.defineProperties(request, {
		canonicalURL: {
			get() {
				console.warn(`Astro.request.canonicalURL has been moved to Astro.canonicalURL`);
				return undefined;
			}
		},
		params: {
			get() {
				console.warn(`Astro.request.params has been moved to Astro.params`);
				return undefined;
			}
		}
	});

	// TODO warn

	return request;
}
