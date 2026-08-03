import type { IncomingHttpHeaders } from 'node:http';
import type { AstroLogger } from './logger/core.js';

type HeaderType = Headers | Record<string, any> | IncomingHttpHeaders;

interface CreateRequestOptions {
	url: URL | string;
	clientAddress?: string | undefined;
	headers: HeaderType;
	method?: string;
	body?: RequestInit['body'];
	logger: AstroLogger;
	locals?: object | undefined;
	/**
	 * Whether the matched route is prerendered.
	 *
	 * On its own this only describes the route. Whether request data (headers, body, search
	 * params) is stripped is controlled by `preserveRequestData`: a prerendered route is treated
	 * as static generation (data stripped) unless `preserveRequestData` is `true`.
	 *
	 * @default false
	 */
	isPrerendered?: boolean;

	/**
	 * Whether to keep request data (headers, body, search params) available even for a prerendered
	 * route. Set this when a prerendered page is served live at request time — for example, in
	 * `"on-request"` middleware mode — so middleware can read the real request.
	 *
	 * Ignored when `isPrerendered` is `false` (request data is always available for SSR routes).
	 *
	 * @default false
	 */
	preserveRequestData?: boolean;

	routePattern: string;

	init?: RequestInit;
}

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
	method = 'GET',
	body = undefined,
	logger,
	isPrerendered = false,
	preserveRequestData = false,
	routePattern,
	init,
}: CreateRequestOptions): Request {
	// A prerendered route is treated as static generation — with no request data — unless the
	// caller asks to preserve it (e.g. a prerendered page served live through `"on-request"`
	// middleware). SSR routes always have request data available.
	const treatAsStatic = isPrerendered && !preserveRequestData;

	// headers are made available on the created request only if the request is for a page that will be on-demand rendered
	const headersObj = treatAsStatic
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
	if (treatAsStatic) {
		url.search = '';
	}

	const request = new Request(url, {
		method: method,
		headers: headersObj,
		// body is made available only if the request is for a page that will be on-demand rendered
		body: treatAsStatic ? null : body,
		...init,
	});

	if (treatAsStatic) {
		// Warn when accessing headers in SSG mode
		let _headers = request.headers;

		// We need to remove descriptor's value and writable properties because we're adding getters and setters.
		const { value, writable, ...headersDesc } =
			Object.getOwnPropertyDescriptor(request, 'headers') || {};

		Object.defineProperty(request, 'headers', {
			...headersDesc,
			get() {
				logger.warn(
					null,
					`\`Astro.request.headers\` was used when rendering the route \`${routePattern}'\`. \`Astro.request.headers\` is not available on prerendered pages. If you need access to request headers, make sure that the page is server-rendered using \`export const prerender = false;\` or by setting \`output\` to \`"server"\` in your Astro config to make all your pages server-rendered by default.`,
				);
				return _headers;
			},
			set(newHeaders: Headers) {
				_headers = newHeaders;
			},
		});
	}

	return request;
}
