import type { MiddlewareMode } from 'astro';
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface UserOptions {
	/**
	 * Specifies the mode that the adapter builds to.
	 *
	 * - 'middleware' - Build to middleware, to be used within another Node.js server, such as Express.
	 * - 'standalone' - Build to a standalone server. The server starts up just by running the built script.
	 */
	mode: 'middleware' | 'standalone';
	/**
	 * Disables HTML streaming. This is useful for example if there are constraints from your host.
	 */
	experimentalDisableStreaming?: boolean;

	/**
	 * If enabled, the adapter will save [static headers in the framework API file](https://docs.netlify.com/frameworks-api/#headers).
	 *
	 * Here the list of the headers that are added:
	 * - The CSP header of the static pages is added when CSP support is enabled.
	 */
	staticHeaders?: boolean;

	/**
	 * Maximum allowed request body size in bytes. Requests with bodies larger than
	 * this limit will throw an error when the body is consumed.
	 *
	 * Set to `Infinity` or `0` to disable the limit.
	 *
	 * @default {1073741824} 1GB
	 */
	experimentalErrorPageHost?: string | URL;

	/**
	 * The middleware mode determines when and how middleware executes.
	 * - `'classic'` (default): Middleware runs for prerendered pages at build time, and for SSR pages at request time. Does not run for prerendered pages at request time.
	 * - `'always'`: Middleware runs for prerendered pages at build time, and for both prerendered and SSR pages at request time.
	 * - `'on-request'`: Middleware runs for both prerendered and SSR pages at request time. Middleware does not run at build time.
	 */
	middlewareMode?: Exclude<MiddlewareMode, 'edge'>;
	bodySizeLimit?: number;
}

export interface Options extends UserOptions {
	host: string | boolean;
	port: number;
	server: string;
	client: string;
	staticHeaders: boolean;
	bodySizeLimit: number;
}

export type RequestHandler = (...args: RequestHandlerParams) => void | Promise<void>;
type RequestHandlerParams = [
	req: IncomingMessage,
	res: ServerResponse,
	next?: (err?: unknown) => void,
	locals?: object,
];

export type NodeAppHeadersJson = {
	pathname: string;
	headers: {
		key: string;
		value: string;
	}[];
}[];
