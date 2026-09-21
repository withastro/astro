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
	 * Controls graceful shutdown behavior of the standalone server when it
	 * receives a `SIGTERM` or `SIGINT` signal (e.g. when a host stops or
	 * restarts the process). The server stops accepting new connections but
	 * waits for active requests to finish before closing.
	 *
	 * @default {{ timeout: 10000, exit: false }}
	 */
	shutdown?: ShutdownOptions;
}

export interface ShutdownOptions {
	/**
	 * The duration in milliseconds to wait for active requests to finish
	 * before force-closing remaining connections. Set to `0` to force-close
	 * immediately, or `Infinity` to wait indefinitely.
	 *
	 * @default {10000} 10 seconds
	 */
	timeout?: number;

	/**
	 * Controls whether to call `process.exit()` once shutdown completes. By
	 * default, the process exits naturally when the event loop is empty,
	 * allowing other signal listeners (e.g. database disconnect handlers) to
	 * finish before closing. Set to `true` to force the process to exit even
	 * if open timers or connections remain.
	 *
	 * @default {false}
	 */
	exit?: boolean;
}

export interface Options extends UserOptions {
	host: string | boolean;
	port: number;
	server: string;
	client: string;
	staticHeaders: boolean;
	bodySizeLimit: number;
	shutdown: Required<ShutdownOptions>;
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
