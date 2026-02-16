import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Http2ServerResponse } from 'node:http2';
import type { Socket } from 'node:net';
import type { RemotePattern } from '../../types/public/config.js';
import { clientAddressSymbol, nodeRequestAbortControllerCleanupSymbol } from '../constants.js';
import { deserializeManifest } from './manifest.js';
import { createOutgoingHttpHeaders } from './createOutgoingHttpHeaders.js';
import type { RenderOptions } from './base.js';
import { App } from './app.js';
import type { NodeAppHeadersJson, SerializedSSRManifest, SSRManifest } from './types.js';
import { validateForwardedHeaders, validateHost } from './validate-headers.js';

/**
 * Allow the request body to be explicitly overridden. For example, this
 * is used by the Express JSON middleware.
 */
interface NodeRequest extends IncomingMessage {
	body?: unknown;
}

/**
 * Converts a NodeJS IncomingMessage into a web standard Request.
 * ```js
 * import { createApp } from 'astro/app/entrypoint';
 * import { createRequest } from 'astro/app/node';
 * import { createServer } from 'node:http';
 *
 * const app = createApp();
 *
 * const server = createServer(async (req, res) => {
 *     const request = createRequest(req);
 *     const response = await app.render(request);
 * })
 * ```
 */
export function createRequest(
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

	const providedProtocol = isEncrypted ? 'https' : 'http';
	const untrustedHostname = req.headers.host ?? req.headers[':authority'];

	// Validate forwarded headers
	// NOTE: Header values may have commas/spaces from proxy chains, extract first value
	const validated = validateForwardedHeaders(
		getFirstForwardedValue(req.headers['x-forwarded-proto']),
		getFirstForwardedValue(req.headers['x-forwarded-host']),
		getFirstForwardedValue(req.headers['x-forwarded-port']),
		allowedDomains,
	);

	const protocol = validated.protocol ?? providedProtocol;
	// validated.host is already validated against allowedDomains
	// For the Host header, we also need to validate against allowedDomains to prevent SSRF
	// The Host header is only trusted if allowedDomains is configured AND the host matches
	// Otherwise, fall back to 'localhost' to prevent SSRF attacks
	const validatedHostname = validateHost(
		typeof untrustedHostname === 'string' ? untrustedHostname : undefined,
		protocol,
		allowedDomains,
	);
	const hostname = validated.host ?? validatedHostname ?? 'localhost';
	const port = validated.port;

	let url: URL;
	try {
		const hostnamePort = getHostnamePort(hostname, port);
		url = new URL(`${protocol}://${hostnamePort}${req.url}`);
	} catch {
		// Fallback using validated hostname to prevent SSRF
		const hostnamePort = getHostnamePort(hostname, port);
		url = new URL(`${protocol}://${hostnamePort}`);
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
 * import { createApp } from 'astro/app/entrypoint';
 * import { createRequest, writeResponse } from 'astro/app/node';
 * import { createServer } from 'node:http';
 *
 * const app = createApp();
 *
 * const server = createServer(async (req, res) => {
 *     const request = createRequest(req);
 *     const response = await app.render(request);
 *     await writeResponse(response, res);
 * })
 * ```
 * @param source WhatWG Response
 * @param destination NodeJS ServerResponse
 */
export async function writeResponse(source: Response, destination: ServerResponse) {
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

/**
 * @deprecated Use `App` or `createApp()` instead, and use in conjunction with `convertRequest()`
 * and `writeResponse()` helpers. This will be removed in a future major version.
 */
export class NodeApp extends App {
	headersMap: NodeAppHeadersJson | undefined = undefined;

	public setHeadersMap(headers: NodeAppHeadersJson) {
		this.headersMap = headers;
	}

	match(req: NodeRequest | Request, allowPrerenderedRoutes = false) {
		if (!(req instanceof Request)) {
			req = createRequest(req, {
				skipBody: true,
				allowedDomains: this.manifest.allowedDomains,
			});
		}
		return super.match(req, allowPrerenderedRoutes);
	}

	render(request: NodeRequest | Request, options?: RenderOptions): Promise<Response> {
		if (!(request instanceof Request)) {
			request = createRequest(request, {
				allowedDomains: this.manifest.allowedDomains,
			});
		}
		return super.render(request, options);
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
	static createRequest = createRequest;

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
	static writeResponse = writeResponse;
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

/** @deprecated This will be removed in a future major version. */
export async function loadManifest(rootFolder: URL): Promise<SSRManifest> {
	const manifestFile = new URL('./manifest.json', rootFolder);
	const rawManifest = await fs.promises.readFile(manifestFile, 'utf-8');
	const serializedManifest: SerializedSSRManifest = JSON.parse(rawManifest);
	return deserializeManifest(serializedManifest);
}

/** @deprecated This will be removed in a future major version. */
export async function loadApp(rootFolder: URL): Promise<NodeApp> {
	const manifest = await loadManifest(rootFolder);
	return new NodeApp(manifest);
}
