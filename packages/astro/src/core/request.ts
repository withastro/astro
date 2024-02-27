import type { IncomingHttpHeaders } from 'node:http';
import type { Logger } from './logger/core.js';

type HeaderType = Headers | Record<string, any> | IncomingHttpHeaders;
type RequestBody = ArrayBuffer | Blob | ReadableStream | URLSearchParams | FormData;

export interface CreateRequestOptions {
	url: URL | string;
	clientAddress?: string | undefined;
	headers: HeaderType;
	method?: string;
	body?: RequestBody | undefined;
	logger: Logger;
	ssr: boolean;
	locals?: object | undefined;
	removeParams?: boolean;
}

const clientAddressSymbol = Symbol.for('astro.clientAddress');
const clientLocalsSymbol = Symbol.for('astro.locals');

export function createRequest({
	url,
	headers,
	clientAddress,
	method = 'GET',
	body = undefined,
	logger,
	ssr,
	locals,
	removeParams = false,
}: CreateRequestOptions): Request {
	let headersObj =
		headers instanceof Headers
			? headers
			: new Headers(Object.entries(headers as Record<string, any>));

	if (typeof url === 'string') url = new URL(url);

	// HACK! astro:assets uses query params for the injected route in `dev`
	if (removeParams && url.pathname !== '/_image') {
		url.search = '';
	}

	const request = new Request(url, {
		method: method,
		headers: headersObj,
		body,
	});

	if (!ssr) {
		// Warn when accessing headers in SSG mode
		const _headers = request.headers;
		const headersDesc = Object.getOwnPropertyDescriptor(request, 'headers') || {};
		Object.defineProperty(request, 'headers', {
			...headersDesc,
			get() {
				logger.warn(
					null,
					`\`Astro.request.headers\` is not available in "static" output mode. To enable header access: set \`output: "server"\` or \`output: "hybrid"\` in your config file.`
				);
				return _headers;
			},
		});
	} else if (clientAddress) {
		Reflect.set(request, clientAddressSymbol, clientAddress);
	}

	Reflect.set(request, clientLocalsSymbol, locals ?? {});

	return request;
}
