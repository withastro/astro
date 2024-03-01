import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RouteData } from '../../@types/astro.js';
import { deserializeManifest } from './common.js';
import { createOutgoingHttpHeaders } from './createOutgoingHttpHeaders.js';
import { App } from './index.js';
import type { RenderOptions } from './index.js';
import type { SSRManifest, SerializedSSRManifest } from './types.js';

export { apply as applyPolyfills } from '../polyfill.js';

const clientAddressSymbol = Symbol.for('astro.clientAddress');

/**
 * Allow the request body to be explicitly overridden. For example, this
 * is used by the Express JSON middleware.
 */
interface NodeRequest extends IncomingMessage {
	body?: unknown;
}

export class NodeApp extends App {
	match(req: NodeRequest | Request) {
		if (!(req instanceof Request)) {
			req = NodeApp.createRequest(req, {
				skipBody: true,
			});
		}
		return super.match(req);
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
		maybeLocals?: object
	) {
		if (!(req instanceof Request)) {
			req = NodeApp.createRequest(req);
		}
		// @ts-expect-error The call would have succeeded against the implementation, but implementation signatures of overloads are not externally visible.
		return super.render(req, routeDataOrOptions, maybeLocals);
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
	static createRequest(req: NodeRequest, { skipBody = false } = {}): Request {
		const protocol =
			req.headers['x-forwarded-proto'] ??
			('encrypted' in req.socket && req.socket.encrypted ? 'https' : 'http');
		const hostname = req.headers.host || req.headers[':authority'];
		const url = `${protocol}://${hostname}${req.url}`;
		const options: RequestInit = {
			method: req.method || 'GET',
			headers: makeRequestHeaders(req),
		};
		const bodyAllowed = options.method !== 'HEAD' && options.method !== 'GET' && skipBody === false;
		if (bodyAllowed) {
			Object.assign(options, makeRequestBody(req));
		}
		const request = new Request(url, options);
		if (req.socket?.remoteAddress) {
			Reflect.set(request, clientAddressSymbol, req.socket.remoteAddress);
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
		const { status, headers, body } = source;
		destination.writeHead(status, createOutgoingHttpHeaders(headers));
		if (!body) return destination.end();
		try {
			const reader = body.getReader();
			destination.on('close', () => {
				// Cancelling the reader may reject not just because of
				// an error in the ReadableStream's cancel callback, but
				// also because of an error anywhere in the stream.
				reader.cancel().catch((err) => {
					// eslint-disable-next-line no-console
					console.error(
						`There was an uncaught error in the middle of the stream while rendering ${destination.req.url}.`,
						err
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
		} catch {
			destination.end('Internal server error');
		}
	}
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
