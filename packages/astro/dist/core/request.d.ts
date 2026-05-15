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
	 * Whether the request is being created for a static build or for a prerendered page within a hybrid/SSR build, or for emulating one of those in dev mode.
	 *
	 * When `true`, the request will not include search parameters or body, and warn when headers are accessed.
	 *
	 * @default false
	 */
	isPrerendered?: boolean;
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
export declare function createRequest({
	url,
	headers,
	method,
	body,
	logger,
	isPrerendered,
	routePattern,
	init,
}: CreateRequestOptions): Request;
export {};
