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
	bodySizeLimit?: number;

	/**
	 * The number of milliseconds of inactivity the server waits for further data on a
	 * connection after it has finished writing the last response, before destroying the
	 * socket. Maps to
	 * [`server.keepAliveTimeout`](https://nodejs.org/api/http.html#serverkeepalivetimeout).
	 *
	 * When the server runs behind a reverse proxy or load balancer, this should be set
	 * **higher** than the proxy's own idle timeout. Otherwise the server can close a pooled
	 * connection that the proxy still believes is usable, and the next request the proxy
	 * sends over it fails — an AWS Application Load Balancer, for example, answers the
	 * client with a `502`. Its idle timeout defaults to 60 seconds, so `65000` is a
	 * common value.
	 *
	 * Set to `0` to disable the timeout entirely, keeping idle connections open
	 * indefinitely.
	 *
	 * Applies to the standalone server started by the built entrypoint. It does not
	 * affect `astro preview`, and in `middleware` mode you own the Node.js server, so
	 * set `server.keepAliveTimeout` on it directly.
	 *
	 * @default {undefined} Node.js's own default (5 seconds today)
	 */
	keepAliveTimeout?: number;
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
