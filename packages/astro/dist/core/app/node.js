import fs from 'node:fs';
import { Http2ServerResponse } from 'node:http2';
import { clientAddressSymbol, nodeRequestAbortControllerCleanupSymbol } from '../constants.js';
import { deserializeManifest } from './manifest.js';
import { createOutgoingHttpHeaders } from './createOutgoingHttpHeaders.js';
import { App } from './app.js';
import {
	getFirstForwardedValue,
	validateForwardedHeaders,
	validateHost,
} from './validate-headers.js';
function createRequest(
	req,
	{ skipBody = false, allowedDomains = [], bodySizeLimit, port: serverPort } = {},
) {
	const controller = new AbortController();
	const isEncrypted = 'encrypted' in req.socket && req.socket.encrypted;
	const providedProtocol = isEncrypted ? 'https' : 'http';
	const untrustedHostname = req.headers.host ?? req.headers[':authority'];
	const validated = validateForwardedHeaders(
		getFirstForwardedValue(req.headers['x-forwarded-proto']),
		getFirstForwardedValue(req.headers['x-forwarded-host']),
		getFirstForwardedValue(req.headers['x-forwarded-port']),
		allowedDomains,
	);
	const protocol = validated.protocol ?? providedProtocol;
	const validatedHostname = validateHost(
		typeof untrustedHostname === 'string' ? untrustedHostname : void 0,
		protocol,
		allowedDomains,
	);
	const hostname = validated.host ?? validatedHostname ?? 'localhost';
	const port =
		validated.port ??
		(!validated.host && !validatedHostname && serverPort ? String(serverPort) : void 0);
	let url;
	try {
		const hostnamePort = getHostnamePort(hostname, port);
		url = new URL(`${protocol}://${hostnamePort}${req.url}`);
	} catch {
		const hostnamePort = getHostnamePort(hostname, port);
		url = new URL(`${protocol}://${hostnamePort}`);
	}
	const options = {
		method: req.method || 'GET',
		headers: makeRequestHeaders(req),
		signal: controller.signal,
	};
	const bodyAllowed = options.method !== 'HEAD' && options.method !== 'GET' && skipBody === false;
	if (bodyAllowed) {
		Object.assign(options, makeRequestBody(req, bodySizeLimit));
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
	const hostValidated = validated.host !== void 0 || validatedHostname !== void 0;
	const forwardedClientIp = hostValidated
		? getFirstForwardedValue(req.headers['x-forwarded-for'])
		: void 0;
	const clientIp = forwardedClientIp || req.socket?.remoteAddress;
	if (clientIp) {
		Reflect.set(request, clientAddressSymbol, clientIp);
	}
	return request;
}
async function writeResponse(source, destination) {
	const { status, headers, body, statusText } = source;
	if (!(destination instanceof Http2ServerResponse)) {
		destination.statusMessage = statusText;
	}
	destination.writeHead(status, createOutgoingHttpHeaders(headers));
	const cleanupAbortFromDestination = getAbortControllerCleanup(destination.req ?? void 0);
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
			reader.cancel().catch((err) => {
				console.error(
					'There was an uncaught error in the middle of the stream while rendering %s.',
					destination.req.url,
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
	} catch (err) {
		destination.write('Internal server error', () => {
			err instanceof Error ? destination.destroy(err) : destination.destroy();
		});
	}
}
class NodeApp extends App {
	headersMap = void 0;
	setHeadersMap(headers) {
		this.headersMap = headers;
	}
	match(req, allowPrerenderedRoutes = false) {
		if (!(req instanceof Request)) {
			req = createRequest(req, {
				skipBody: true,
				allowedDomains: this.manifest.allowedDomains,
			});
		}
		return super.match(req, allowPrerenderedRoutes);
	}
	render(request, options) {
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
function getHostnamePort(hostname, port) {
	const portInHostname = typeof hostname === 'string' && /:\d+$/.test(hostname);
	const hostnamePort = portInHostname ? hostname : `${hostname}${port ? `:${port}` : ''}`;
	return hostnamePort;
}
function makeRequestHeaders(req) {
	const headers = new Headers();
	for (const [name, value] of Object.entries(req.headers)) {
		if (value === void 0) {
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
function makeRequestBody(req, bodySizeLimit) {
	if (req.body !== void 0) {
		if (typeof req.body === 'string' && req.body.length > 0) {
			return { body: Buffer.from(req.body) };
		}
		if (typeof req.body === 'object' && req.body !== null && Object.keys(req.body).length > 0) {
			return { body: Buffer.from(JSON.stringify(req.body)) };
		}
		if (
			typeof req.body === 'object' &&
			req.body !== null &&
			typeof req.body[Symbol.asyncIterator] !== 'undefined'
		) {
			return asyncIterableToBodyProps(req.body, bodySizeLimit);
		}
	}
	return asyncIterableToBodyProps(req, bodySizeLimit);
}
function asyncIterableToBodyProps(iterable, bodySizeLimit) {
	const source = bodySizeLimit != null ? limitAsyncIterable(iterable, bodySizeLimit) : iterable;
	return {
		// Node uses undici for the Request implementation. Undici accepts
		// a non-standard async iterable for the body.
		// @ts-expect-error
		body: source,
		// The duplex property is required when using a ReadableStream or async
		// iterable for the body. The type definitions do not include the duplex
		// property because they are not up-to-date.
		duplex: 'half',
	};
}
async function* limitAsyncIterable(iterable, limit) {
	let received = 0;
	for await (const chunk of iterable) {
		const byteLength =
			chunk instanceof Uint8Array
				? chunk.byteLength
				: typeof chunk === 'string'
					? Buffer.byteLength(chunk)
					: 0;
		received += byteLength;
		if (received > limit) {
			throw new Error(`Body size limit exceeded: received more than ${limit} bytes`);
		}
		yield chunk;
	}
}
function getAbortControllerCleanup(req) {
	if (!req) return void 0;
	const cleanup = Reflect.get(req, nodeRequestAbortControllerCleanupSymbol);
	return typeof cleanup === 'function' ? cleanup : void 0;
}
function getRequestSocket(req) {
	if (req.socket && typeof req.socket.on === 'function') {
		return req.socket;
	}
	const http2Socket = req.stream?.session?.socket;
	if (http2Socket && typeof http2Socket.on === 'function') {
		return http2Socket;
	}
	return void 0;
}
async function loadManifest(rootFolder) {
	const manifestFile = new URL('./manifest.json', rootFolder);
	const rawManifest = await fs.promises.readFile(manifestFile, 'utf-8');
	const serializedManifest = JSON.parse(rawManifest);
	return deserializeManifest(serializedManifest);
}
async function loadApp(rootFolder) {
	const manifest = await loadManifest(rootFolder);
	return new NodeApp(manifest);
}
export { NodeApp, createRequest, getAbortControllerCleanup, loadApp, loadManifest, writeResponse };
