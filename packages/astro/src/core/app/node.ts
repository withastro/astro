import fs from 'node:fs';
import { App } from './index.js';
import { deserializeManifest } from './common.js';
import type { IncomingMessage, ServerResponse, OutgoingHttpHeaders } from 'node:http';
import type { RouteData } from '../../@types/astro.js';
import type { RenderOptions } from './index.js';
import type { SerializedSSRManifest, SSRManifest } from './types.js';

export { apply as applyPolyfills } from '../polyfill.js';

/**
 * Allow the request body to be explicitly overridden. For example, this
 * is used by the Express JSON middleware.
 */
interface NodeRequest extends IncomingMessage {
	body?: unknown;
}

const addCookieHeader = true;

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
	render(
		request: NodeRequest | Request,
		routeData?: RouteData,
		locals?: object
	): Promise<Response>;
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
	 */
	static createRequest(
		req: NodeRequest,
		{ skipBody = false } = {}
	): Request {
		const protocol = req.headers['x-forwarded-proto'] ??
			('encrypted' in req.socket && req.socket.encrypted ? 'https' : 'http');
		const hostname = req.headers.host || req.headers[':authority'];
		const url = `${protocol}://${hostname}${req.url}`;
		const options: RequestInit = {
			method: req.method || 'GET',
			headers: makeRequestHeaders(req),
		}
		const bodyAllowed = options.method !== 'HEAD' && options.method !== 'GET' && skipBody === false;
		if (bodyAllowed) {
			Object.assign(options, makeRequestBody(req));
		}
		const request = new Request(url, options);
		if (req.socket?.remoteAddress) {
			Reflect.set(request, App.Symbol.clientAddress, req.socket.remoteAddress);
		}
		return request;
	}

	/**
	 * Streams a web-standard Response into a NodeJS Server Response.
	 * @param source WhatWG Response 
	 * @param destination NodeJS ServerResponse
	 */
	static async writeResponse(source: Response, destination: ServerResponse) {
		const { status, headers, body } = source;
		destination.writeHead(status, createOutgoingHttpHeaders(headers));
		if (body) {
			try {
				const reader = body.getReader();
				destination.on('close', () => {
					reader.cancel();
				});
				let result = await reader.read();
				while (!result.done) {
					destination.write(result.value);
					result = await reader.read();
				}
			} catch (err: any) {
				console.error(err?.stack || err?.message || String(err));
				destination.write('Internal server error');
			}
		}
		destination.end();
	};
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

/**
 * Takes in a nullable WebAPI Headers object and produces a NodeJS OutgoingHttpHeaders object suitable for usage
 * with ServerResponse.writeHead(..) or ServerResponse.setHeader(..)
 *
 * @param webHeaders WebAPI Headers object
 * @returns NodeJS OutgoingHttpHeaders object with multiple set-cookie handled as an array of values
 */
export const createOutgoingHttpHeaders = (
	headers: Headers | undefined | null
): OutgoingHttpHeaders | undefined => {
	if (!headers) {
		return undefined;
	}

	// at this point, a multi-value'd set-cookie header is invalid (it was concatenated as a single CSV, which is not valid for set-cookie)
	const nodeHeaders: OutgoingHttpHeaders = Object.fromEntries(headers.entries());

	if (Object.keys(nodeHeaders).length === 0) {
		return undefined;
	}

	// if there is > 1 set-cookie header, we have to fix it to be an array of values
	if (headers.has('set-cookie')) {
		const cookieHeaders = headers.getSetCookie();
		if (cookieHeaders.length > 1) {
			// the Headers.entries() API already normalized all header names to lower case so we can safely index this as 'set-cookie'
			nodeHeaders['set-cookie'] = cookieHeaders;
		}
	}

	return nodeHeaders;
};
