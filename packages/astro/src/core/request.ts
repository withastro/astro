import type { IncomingHttpHeaders } from 'node:http';
import type { Logger } from './logger/core.js';
import { appendForwardSlash, prependForwardSlash } from './path.js';

type HeaderType = Headers | Record<string, any> | IncomingHttpHeaders;
type RequestBody = ArrayBuffer | Blob | ReadableStream | URLSearchParams | FormData;

export interface CreateRequestOptions {
	base: string;
	url: URL | string;
	clientAddress?: string | undefined;
	headers: HeaderType;
	method?: string;
	body?: RequestBody | undefined;
	logger: Logger;
	locals?: object | undefined;
	/**
	 * Whether the request is being created for a static build or for a prerendered page within a hybrid/SSR build, or for emulating one of those in dev mode.
	 * 
	 * When `true`, the request will not include search parameters or body, and warn when headers are accessed.
	 * 
	 * @default false
	 */
	staticLike?: boolean;
}

const clientAddressSymbol = Symbol.for('astro.clientAddress');
const clientLocalsSymbol = Symbol.for('astro.locals');

export function createRequest({
	base,
	url,
	headers,
	clientAddress,
	method = 'GET',
	body = undefined,
	logger,
	locals,
	staticLike = false
}: CreateRequestOptions): Request {
	// headers are made available on the created request only if the request is for a page that will be on-demand rendered
	const headersObj =
		staticLike ? undefined :
		headers instanceof Headers
			? headers
			: new Headers(Object.entries(headers as Record<string, any>));

	if (typeof url === 'string') url = new URL(url);

	prependForwardSlash(appendForwardSlash(base));
	// HACK! astro:assets uses query params for the injected route in `dev`
	if (staticLike && url.pathname !== `${prependForwardSlash(appendForwardSlash(base))}_image`) {
		url.search = '';
	}

	const request = new Request(url, {
		method: method,
		headers: headersObj,
		// body is made available only if the request is for a page that will be on-demand rendered
		body: staticLike ? null : body,
	});

	if (staticLike) {
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
		// clientAddress is stored to be read by RenderContext, only if the request is for a page that will be on-demand rendered
		Reflect.set(request, clientAddressSymbol, clientAddress);
	}

	Reflect.set(request, clientLocalsSymbol, locals ?? {});

	return request;
}
