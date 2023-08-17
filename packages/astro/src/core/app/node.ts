import type { RouteData } from '../../@types/astro';
import type { SerializedSSRManifest, SSRManifest } from './types';

import * as fs from 'node:fs';
import { IncomingMessage } from 'node:http';
import { TLSSocket } from 'node:tls';
import { deserializeManifest } from './common.js';
import { App, type MatchOptions } from './index.js';
export { apply as applyPolyfills } from '../polyfill.js';

const clientAddressSymbol = Symbol.for('astro.clientAddress');

type CreateNodeRequestOptions = {
	emptyBody?: boolean;
};

type BodyProps = Partial<RequestInit>;

function createRequestFromNodeRequest(
	req: NodeIncomingMessage,
	options?: CreateNodeRequestOptions
): Request {
	const protocol =
		req.socket instanceof TLSSocket || req.headers['x-forwarded-proto'] === 'https'
			? 'https'
			: 'http';
	const hostname = req.headers.host || req.headers[':authority'];
	const url = `${protocol}://${hostname}${req.url}`;
	const headers = makeRequestHeaders(req);
	const method = req.method || 'GET';
	let bodyProps: BodyProps = {};
	const bodyAllowed = method !== 'HEAD' && method !== 'GET' && !options?.emptyBody;
	if (bodyAllowed) {
		bodyProps = makeRequestBody(req);
	}
	const request = new Request(url, {
		method,
		headers,
		...bodyProps,
	});
	if (req.socket?.remoteAddress) {
		Reflect.set(request, clientAddressSymbol, req.socket.remoteAddress);
	}
	return request;
}

function makeRequestHeaders(req: NodeIncomingMessage): Headers {
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

function makeRequestBody(req: NodeIncomingMessage): BodyProps {
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

function asyncIterableToBodyProps(iterable: AsyncIterable<any>): BodyProps {
	return {
		// Node uses undici for the Request implementation. Undici accepts
		// a non-standard async iterable for the body.
		// @ts-expect-error
		body: iterable,
		// The duplex property is required when using a ReadableStream or async
		// iterable for the body. The type definitions do not include the duplex
		// property because they are not up-to-date.
		// @ts-expect-error
		duplex: 'half',
	} satisfies BodyProps;
}

class NodeIncomingMessage extends IncomingMessage {
	/**
	 * Allow the request body to be explicitly overridden. For example, this
	 * is used by the Express JSON middleware.
	 */
	body?: unknown;
}

export class NodeApp extends App {
	match(req: NodeIncomingMessage | Request, opts: MatchOptions = {}) {
		if (!(req instanceof Request)) {
			req = createRequestFromNodeRequest(req, {
				emptyBody: true,
			});
		}
		return super.match(req, opts);
	}
	render(req: NodeIncomingMessage | Request, routeData?: RouteData, locals?: object) {
		if (!(req instanceof Request)) {
			req = createRequestFromNodeRequest(req);
		}
		return super.render(req, routeData, locals);
	}
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
