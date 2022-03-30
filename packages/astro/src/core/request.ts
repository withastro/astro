import type { IncomingHttpHeaders } from 'http';
import type { LogOptions } from './logger/core';
import { warn } from './logger/core.js';

type HeaderType = Headers | Record<string, any> | IncomingHttpHeaders;
type RequestBody = ArrayBuffer | Blob | ReadableStream | URLSearchParams | FormData;

export interface CreateRequestOptions {
	url: URL | string;
	headers: HeaderType;
	method?: string;
	body?: RequestBody | undefined;
	logging: LogOptions;
}

export function createRequest({ url, headers, method = 'GET', body = undefined, logging }: CreateRequestOptions): Request {
	let headersObj = headers instanceof Headers ? headers : new Headers(Object.entries(headers as Record<string, any>));

	const request = new Request(url.toString(), {
		method: method,
		headers: headersObj,
		body,
	});

	Object.defineProperties(request, {
		canonicalURL: {
			get() {
				warn(logging, 'deprecation', `Astro.request.canonicalURL has been moved to Astro.canonicalURL`);
				return undefined;
			},
		},
		params: {
			get() {
				warn(logging, 'deprecation', `Astro.request.params has been moved to Astro.params`);
				return undefined;
			},
		},
	});

	return request;
}
