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
	locals?: object | undefined;
	/**
	 * Whether the request is being created for a static build or for a prerendered page within a hybrid/SSR build, or for emulating one of those in dev mode.
	 *
	 * When `true`, the request will not include search parameters or body, and warn when headers are accessed.
	 *
	 * @default false
	 */
	isPrerendered?: boolean;
}

const clientAddressSymbol = Symbol.for('astro.clientAddress');
const clientLocalsSymbol = Symbol.for('astro.locals');

/**
 * Used by astro internals to create a web standard request object.
 *
 * The user of this function may provide the data in a runtime-agnostic way.
 *
 * This is used by the static build to create fake requests for prerendering, and by the dev server to convert node requests into the standard request object.
 */
export function createRequest({
	url,
	headers,
	clientAddress,
	method = 'GET',
	body = undefined,
	logger,
	locals,
	isPrerendered = false,
}: CreateRequestOptions): Request {
	// headers are made available on the created request only if the request is for a page that will be on-demand rendered
	const headersObj = isPrerendered
		? undefined
		: headers instanceof Headers
			? headers
			: new Headers(
					// Filter out HTTP/2 pseudo-headers. These are internally-generated headers added to all HTTP/2 requests with trusted metadata about the request.
					// Examples include `:method`, `:scheme`, `:authority`, and `:path`.
					// They are always prefixed with a colon to distinguish them from other headers, and it is an error to add the to a Headers object manually.
					// See https://httpwg.org/specs/rfc7540.html#HttpRequest
					Object.entries(headers as Record<string, any>).filter(([name]) => !name.startsWith(':')),
				);

	if (typeof url === 'string') url = new URL(url);

	// Remove search parameters if the request is for a page that will be on-demand rendered
	if (isPrerendered) {
		url.search = '';
	}

	const request = new Request(url, {
		method: method,
		headers: headersObj,
		// body is made available only if the request is for a page that will be on-demand rendered
		body: isPrerendered ? null : body,
	});

	if (isPrerendered) {
		// Warn when accessing headers in prerendered pages
		const _headers = request.headers;
		const headersDesc = Object.getOwnPropertyDescriptor(request, 'headers') || {};
		Object.defineProperty(request, 'headers', {
			...headersDesc,
			get() {
				logger.warn(
					null,
					`\`Astro.request.headers\` is not available on prerendered pages. If you need access to request headers, make sure that the page is server rendered using \`export const prerender = false;\` or by setting \`output\` to \`"server"\` in your Astro config to make all your pages server rendered.`,
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
