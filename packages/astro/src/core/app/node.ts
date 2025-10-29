import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Http2ServerResponse } from 'node:http2';
import type { Socket } from 'node:net';
// matchPattern is used in App.validateForwardedHost, no need to import here
import type { MiddlewareHandler } from '../../types/public/common.js';
import type { RemotePattern } from '../../types/public/config.js';
import type { APIContext } from '../../types/public/context.js';
import type { RouteData } from '../../types/public/internal.js';
import { clientAddressSymbol, nodeRequestAbortControllerCleanupSymbol } from '../constants.js';
import { createContext } from '../middleware/index.js';
import { deserializeManifest } from './common.js';
import { createOutgoingHttpHeaders } from './createOutgoingHttpHeaders.js';
import type { RenderOptions } from './index.js';
import { App } from './index.js';
import type { NodeAppHeadersJson, SerializedSSRManifest, SSRManifest } from './types.js';

export { apply as applyPolyfills } from '../polyfill.js';

/**
 * Allow the request body to be explicitly overridden. For example, this
 * is used by the Express JSON middleware.
 */
interface NodeRequest extends IncomingMessage {
	body?: unknown;
}

export class NodeApp extends App {
	headersMap: NodeAppHeadersJson | undefined = undefined;

	public setHeadersMap(headers: NodeAppHeadersJson) {
		this.headersMap = headers;
	}

	match(req: NodeRequest | Request, allowPrerenderedRoutes = false) {
		if (!(req instanceof Request)) {
			req = NodeApp.createRequest(req, {
				skipBody: true,
				allowedDomains: this.manifest.allowedDomains,
			});
		}
		return super.match(req, allowPrerenderedRoutes);
	}
	render(request: NodeRequest | Request, options?: RenderOptions): Promise<Response>;
	/**
	 * @deprecated Instead of passing `RouteData` and locals individually, pass an object with `routeData` and `locals` properties.
	 * See https://github.com/withastro/astro/pull/9199 for more information.
	 */
	render(request: NodeRequest | Request, routeData?: RouteData, locals?: object): Promise<Response>;
	render(
		req: NodeRequest | Request,
		routeDataOrOptions?: RouteData | RenderOptions,
		maybeLocals?: object,
	) {
		if (!(req instanceof Request)) {
			req = NodeApp.createRequest(req, {
				allowedDomains: this.manifest.allowedDomains,
			});
		}
		// @ts-expect-error The call would have succeeded against the implementation, but implementation signatures of overloads are not externally visible.
		return super.render(req, routeDataOrOptions, maybeLocals);
	}

	/**
	 * Get user-defined locales from the manifest in a typed, safe way.
	 * Handles various manifest structures for i18n locales.
	 */
	getUserDefinedLocales(): string[] {
		if (!this.manifest.i18n?.locales) {
			return [];
		}

		const locales = this.manifest.i18n.locales;

		// Handle array of strings or locale objects
		if (Array.isArray(locales)) {
			return locales.filter((l): l is string => typeof l === 'string');
		}

		// Handle single string
		if (typeof locales === 'string') {
			return [locales];
		}

		// Handle object with codes property
		if (
			typeof locales === 'object' &&
			locales !== null &&
			'codes' in locales &&
			Array.isArray((locales as any).codes)
		) {
			return (locales as any).codes;
		}

		return [];
	}

	/**
	 * Create a middleware context for a request.
	 * This provides the same context that would be created during SSR,
	 * but without performing the full render operation.
	 * Useful for executing middleware on prerendered/static routes.
	 */
	createMiddlewareContext(
		request: Request,
		routeData: RouteData | undefined,
		locals?: object,
	): APIContext {
		// Ensure params is always an object
		const params =
			routeData && typeof routeData.params === 'object' && !Array.isArray(routeData.params)
				? routeData.params
				: {};

		// Get user-defined locales
		const userDefinedLocales = this.getUserDefinedLocales();

		// Create context using the same method as the middleware system
		const ctx = createContext({
			request,
			params,
			locals: locals ?? {},
			defaultLocale: this.manifest.i18n?.defaultLocale || '',
			userDefinedLocales,
		});

		// Mark this as a prerendered page if applicable
		if (routeData?.prerender) {
			ctx.isPrerendered = true;
		}

		// Set the site if available
		if (this.manifest.site) {
			ctx.site = new URL(this.manifest.site);
		}

		// Set the route pattern if we have route data
		if (routeData) {
			ctx.routePattern = routeData.route;
		}

		return ctx;
	}

	/**
	 * Execute middleware for a request without performing a full render.
	 * Returns whether the middleware handled the response (by not calling next()).
	 *
	 * This is used by the static handler to run middleware on prerendered routes
	 * before serving the static file.
	 * 
	 * **Security Note:** The middleware context is marked as `isPrerendered: true`,
	 * which causes the origin checking middleware to skip CSRF validation. This is
	 * intentional to allow static file serving, but you should implement your own
	 * security checks in custom middleware if needed for prerendered pages.
	 */
	async executeMiddlewareOnly(
		request: Request,
		routeData: RouteData | undefined,
		middleware: MiddlewareHandler,
		locals?: object,
	): Promise<{ handled: boolean; response: Response | null }> {
		// Create middleware context
		const ctx = this.createMiddlewareContext(request, routeData, locals);

		let nextCalled = false;

		// Create a next function - if called, we'll serve the static file normally
		const middlewareNext = async (): Promise<Response> => {
			nextCalled = true;
			// Return a dummy response - the static file will be served after middleware returns
			return new Response(null);
		};

		// Execute middleware
		const response = await middleware(ctx, middlewareNext);

		// If middleware returned a response and didn't call next(), use it
		if (response && !nextCalled) {
			// Manually append cookies from context to response headers
			for (const setCookieHeaderValue of ctx.cookies.headers()) {
				response.headers.append('set-cookie', setCookieHeaderValue);
			}

			return { handled: true, response };
		}

		// Middleware called next() - continue with static file serving
		// But return the response so headers can be copied
		if (response) {
			// Manually append cookies from context to response headers
			for (const setCookieHeaderValue of ctx.cookies.headers()) {
				response.headers.append('set-cookie', setCookieHeaderValue);
			}
			return { handled: false, response };
		}

		return { handled: false, response: null };
	}

	/**
	 * Converts a NodeJS IncomingMessage into a web standard Request.
	 * ```js
	 * import { NodeApp } from 'astro/app/node';
	 * import { createServer } from 'node:http';
	 *
	 * const server = createServer(async (req, res) => {
	 *     const request = NodeApp.createRequest(req);
	 *     const response = await app.render(request);
	 *     await NodeApp.writeResponse(response, res);
	 * })
	 * ```
	 */
	static createRequest(
		req: NodeRequest,
		{
			skipBody = false,
			allowedDomains = [],
		}: { skipBody?: boolean; allowedDomains?: Partial<RemotePattern>[] } = {},
	): Request {
		const controller = new AbortController();

		const isEncrypted = 'encrypted' in req.socket && req.socket.encrypted;

		// Parses multiple header and returns first value if available.
		const getFirstForwardedValue = (multiValueHeader?: string | string[]) => {
			return multiValueHeader
				?.toString()
				?.split(',')
				.map((e) => e.trim())?.[0];
		};

		// Get the used protocol between the end client and first proxy.
		// NOTE: Some proxies append values with spaces and some do not.
		// We need to handle it here and parse the header correctly.
		// @example "https, http,http" => "http"
		const forwardedProtocol = getFirstForwardedValue(req.headers['x-forwarded-proto']);
		const providedProtocol = isEncrypted ? 'https' : 'http';
		const protocol = forwardedProtocol ?? providedProtocol;

		// @example "example.com,www2.example.com" => "example.com"
		let forwardedHostname = getFirstForwardedValue(req.headers['x-forwarded-host']);
		const providedHostname = req.headers.host ?? req.headers[':authority'];

		// Validate X-Forwarded-Host against allowedDomains if configured
		if (
			forwardedHostname &&
			!App.validateForwardedHost(
				forwardedHostname,
				allowedDomains,
				forwardedProtocol ?? providedProtocol,
			)
		) {
			// If not allowed, ignore the X-Forwarded-Host header
			forwardedHostname = undefined;
		}

		const hostname = forwardedHostname ?? providedHostname;

		// @example "443,8080,80" => "443"
		const port = getFirstForwardedValue(req.headers['x-forwarded-port']);

		let url: URL;
		try {
			const hostnamePort = getHostnamePort(hostname, port);
			url = new URL(`${protocol}://${hostnamePort}${req.url}`);
		} catch {
			// Fallback to the provided hostname and port
			const hostnamePort = getHostnamePort(providedHostname, port);
			url = new URL(`${providedProtocol}://${hostnamePort}`);
		}

		const options: RequestInit = {
			method: req.method || 'GET',
			headers: makeRequestHeaders(req),
			signal: controller.signal,
		};
		const bodyAllowed = options.method !== 'HEAD' && options.method !== 'GET' && skipBody === false;
		if (bodyAllowed) {
			Object.assign(options, makeRequestBody(req));
		}

		const request = new Request(url, options);

		const socket = getRequestSocket(req);
		if (socket && typeof socket.on === 'function') {
			const existingCleanup = getAbortControllerCleanup(req);
			if (existingCleanup) {
				existingCleanup();
			}
			let cleanedUp = false;

			const removeSocketListener = () => {
				if (typeof socket.off === 'function') {
					socket.off('close', onSocketClose);
				} else if (typeof socket.removeListener === 'function') {
					socket.removeListener('close', onSocketClose);
				}
			};

			const cleanup = () => {
				if (cleanedUp) return;
				cleanedUp = true;
				removeSocketListener();
				controller.signal.removeEventListener('abort', cleanup);
				Reflect.deleteProperty(req, nodeRequestAbortControllerCleanupSymbol);
			};

			const onSocketClose = () => {
				cleanup();
				if (!controller.signal.aborted) {
					controller.abort();
				}
			};

			socket.on('close', onSocketClose);
			controller.signal.addEventListener('abort', cleanup, { once: true });
			Reflect.set(req, nodeRequestAbortControllerCleanupSymbol, cleanup);

			if (socket.destroyed) {
				onSocketClose();
			}
		}

		// Get the IP of end client behind the proxy.
		// @example "1.1.1.1,8.8.8.8" => "1.1.1.1"
		const forwardedClientIp = getFirstForwardedValue(req.headers['x-forwarded-for']);
		const clientIp = forwardedClientIp || req.socket?.remoteAddress;
		if (clientIp) {
			Reflect.set(request, clientAddressSymbol, clientIp);
		}

		return request;
	}

	/**
	 * Streams a web-standard Response into a NodeJS Server Response.
	 * ```js
	 * import { NodeApp } from 'astro/app/node';
	 * import { createServer } from 'node:http';
	 *
	 * const server = createServer(async (req, res) => {
	 *     const request = NodeApp.createRequest(req);
	 *     const response = await app.render(request);
	 *     await NodeApp.writeResponse(response, res);
	 * })
	 * ```
	 * @param source WhatWG Response
	 * @param destination NodeJS ServerResponse
	 */
	static async writeResponse(source: Response, destination: ServerResponse) {
		const { status, headers, body, statusText } = source;
		// HTTP/2 doesn't support statusMessage
		if (!(destination instanceof Http2ServerResponse)) {
			destination.statusMessage = statusText;
		}
		destination.writeHead(status, createOutgoingHttpHeaders(headers));

		const cleanupAbortFromDestination = getAbortControllerCleanup(
			(destination.req as NodeRequest | undefined) ?? undefined,
		);
		if (cleanupAbortFromDestination) {
			const runCleanup = () => {
				cleanupAbortFromDestination();
				if (typeof destination.off === 'function') {
					destination.off('finish', runCleanup);
					destination.off('close', runCleanup);
				} else {
					destination.removeListener?.('finish', runCleanup);
					destination.removeListener?.('close', runCleanup);
				}
			};
			destination.on('finish', runCleanup);
			destination.on('close', runCleanup);
		}
		if (!body) return destination.end();
		try {
			const reader = body.getReader();
			destination.on('close', () => {
				// Cancelling the reader may reject not just because of
				// an error in the ReadableStream's cancel callback, but
				// also because of an error anywhere in the stream.
				reader.cancel().catch((err) => {
					console.error(
						`There was an uncaught error in the middle of the stream while rendering ${destination.req.url}.`,
						err,
					);
				});
			});
			let result = await reader.read();
			while (!result.done) {
				destination.write(result.value);
				result = await reader.read();
			}
			destination.end();
			// the error will be logged by the "on end" callback above
		} catch (err) {
			destination.write('Internal server error', () => {
				err instanceof Error ? destination.destroy(err) : destination.destroy();
			});
		}
	}
}

function getHostnamePort(hostname: string | string[] | undefined, port?: string): string {
	const portInHostname = typeof hostname === 'string' && /:\d+$/.test(hostname);
	const hostnamePort = portInHostname ? hostname : `${hostname}${port ? `:${port}` : ''}`;
	return hostnamePort;
}

function makeRequestHeaders(req: NodeRequest): Headers {
	const headers = new Headers();
	for (const [name, value] of Object.entries(req.headers)) {
		if (value === undefined) {
			continue;
		}
		if (Array.isArray(value)) {
			for (const item of value) {
				headers.append(name, item);
			}
		} else {
			headers.append(name, value);
		}
	}
	return headers;
}

function makeRequestBody(req: NodeRequest): RequestInit {
	if (req.body !== undefined) {
		if (typeof req.body === 'string' && req.body.length > 0) {
			return { body: Buffer.from(req.body) };
		}

		if (typeof req.body === 'object' && req.body !== null && Object.keys(req.body).length > 0) {
			return { body: Buffer.from(JSON.stringify(req.body)) };
		}

		// This covers all async iterables including Readable and ReadableStream.
		if (
			typeof req.body === 'object' &&
			req.body !== null &&
			typeof (req.body as any)[Symbol.asyncIterator] !== 'undefined'
		) {
			return asyncIterableToBodyProps(req.body as AsyncIterable<any>);
		}
	}

	// Return default body.
	return asyncIterableToBodyProps(req);
}

function asyncIterableToBodyProps(iterable: AsyncIterable<any>): RequestInit {
	return {
		// Node uses undici for the Request implementation. Undici accepts
		// a non-standard async iterable for the body.
		// @ts-expect-error
		body: iterable,
		// The duplex property is required when using a ReadableStream or async
		// iterable for the body. The type definitions do not include the duplex
		// property because they are not up-to-date.
		duplex: 'half',
	};
}

function getAbortControllerCleanup(req?: NodeRequest): (() => void) | undefined {
	if (!req) return undefined;
	const cleanup = Reflect.get(req, nodeRequestAbortControllerCleanupSymbol);
	return typeof cleanup === 'function' ? cleanup : undefined;
}

function getRequestSocket(req: NodeRequest): Socket | undefined {
	if (req.socket && typeof req.socket.on === 'function') {
		return req.socket;
	}
	const http2Socket = (req as unknown as { stream?: { session?: { socket?: Socket } } }).stream
		?.session?.socket;
	if (http2Socket && typeof http2Socket.on === 'function') {
		return http2Socket;
	}
	return undefined;
}

export async function loadManifest(rootFolder: URL): Promise<SSRManifest> {
	const manifestFile = new URL('./manifest.json', rootFolder);
	const rawManifest = await fs.promises.readFile(manifestFile, 'utf-8');
	const serializedManifest: SerializedSSRManifest = JSON.parse(rawManifest);
	return deserializeManifest(serializedManifest);
}

export async function loadApp(rootFolder: URL): Promise<NodeApp> {
	const manifest = await loadManifest(rootFolder);
	return new NodeApp(manifest);
}
