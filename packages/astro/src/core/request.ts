import type { IncomingHttpHeaders } from 'http';
import type { LogOptions } from './logger/core';
import { warn } from './logger/core.js';

type HeaderType = Headers | Record<string, any> | IncomingHttpHeaders;
type RequestBody = ArrayBuffer | Blob | ReadableStream | URLSearchParams | FormData;

export interface CreateRequestOptions {
	url: URL | string;
	clientAddress?: string | undefined;
	headers: HeaderType;
	method?: string;
	body?: RequestBody | undefined;
	logging: LogOptions;
	ssr: boolean;
}

const clientAddressSymbol = Symbol.for('astro.clientAddress');
const clientLocalsSymbol = Symbol.for('astro.locals');

export function createRequest({
	url,
	headers,
	clientAddress,
	method = 'GET',
	body = undefined,
	logging,
	ssr,
}: CreateRequestOptions): Request {
	let headersObj =
		headers instanceof Headers
			? headers
			: new Headers(Object.entries(headers as Record<string, any>));

	const request = new Request(url.toString(), {
		method: method,
		headers: headersObj,
		body,
	});

	Object.defineProperties(request, {
		params: {
			get() {
				warn(logging, 'deprecation', `Astro.request.params has been moved to Astro.params`);
				return undefined;
			},
		},
	});

	if (!ssr) {
		// Warn when accessing headers in SSG mode
		const _headers = request.headers;
		const headersDesc = Object.getOwnPropertyDescriptor(request, 'headers') || {};
		Object.defineProperty(request, 'headers', {
			...headersDesc,
			get() {
				warn(
					logging,
					'ssg',
					`Headers are not exposed in static (SSG) output mode. To enable headers: set \`output: "server"\` in your config file.`
				);
				return _headers;
			},
		});
	} else if (clientAddress) {
		Reflect.set(request, clientAddressSymbol, clientAddress);
	}

	// TODO: PLT-104 check if this needs to be set in another adapters?
	Reflect.set(request, clientLocalsSymbol, {});

	return request;
}
