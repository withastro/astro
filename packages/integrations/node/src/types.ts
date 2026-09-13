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
	 * Controls graceful shutdown of the standalone server on `SIGTERM`/`SIGINT`.
	 * The server stops accepting new connections but gives in-flight requests
	 * time to finish before closing. Set `timeout: 0` to force-close immediately
	 * instead.
	 *
	 * @default {{ timeout: 10000, exit: false }}
	 */
	shutdown?: ShutdownOptions;
}

export interface ShutdownOptions {
	/**
	 * How long, in milliseconds, to wait for in-flight requests to finish after
	 * receiving `SIGTERM`/`SIGINT` before force-closing any remaining connections.
	 *
	 * Set to `0` to force-close immediately, or `Infinity` to wait indefinitely
	 * for in-flight requests to finish.
	 *
	 * @default {10000} 10 seconds
	 */
	timeout?: number;

	/**
	 * Whether to call `process.exit()` once shutdown completes.
	 *
	 * By default, the adapter lets the process exit naturally once the event loop is
	 * empty, so any other `SIGTERM`/`SIGINT` listeners your app has registered (for
	 * example, to close a database connection) get a chance to finish first. Enable
	 * this only if you want a guaranteed exit even when something else in the
	 * process (a timer, an open connection) would otherwise keep it running.
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
