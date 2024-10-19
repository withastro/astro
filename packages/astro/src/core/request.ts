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

/**
 * Used by astro internals to create a web standard request object.
 *
 * The user of this function may provide the data in a runtime-agnostic way.
 *
 * This is used by the static build to create fake requests for prerendering, and by the dev server to convert node requests into the standard request object.
 */
export function createRequest({
	base,
	url,
	headers,
	clientAddress,
	method = 'GET',
	body = undefined,
	logger,
	locals,
	staticLike = false,
}: CreateRequestOptions): Request {
	// headers are made available on the created request only if the request is for a page that will be on-demand rendered
	const headersObj = staticLike
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

	const imageEndpoint = prependForwardSlash(appendForwardSlash(base)) + '_image';

	// HACK! astro:assets uses query params for the injected route in `dev`
	if (staticLike && url.pathname !== imageEndpoint) {
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
					`\`Astro.request.headers\` is unavailable in "static" output mode, and in prerendered pages within "hybrid" and "server" output modes. If you need access to request headers, make sure that \`output\` is configured as either \`"server"\` or \`output: "hybrid"\` in your config file, and that the page accessing the headers is rendered on-demand.`,
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
