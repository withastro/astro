import type { App } from 'astro/app';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';

const clientAddressSymbol = Symbol.for('astro.clientAddress');

/*
  Credits to the SvelteKit team
	https://github.com/sveltejs/kit/blob/69913e9fda054fa6a62a80e2bb4ee7dca1005796/packages/kit/src/node.js
*/

function get_raw_body(req: IncomingMessage) {
	return new Promise<Uint8Array | null>((fulfil, reject) => {
		const h = req.headers;

		if (!h['content-type']) {
			return fulfil(null);
		}

		req.on('error', reject);

		const length = Number(h['content-length']);

		// https://github.com/jshttp/type-is/blob/c1f4388c71c8a01f79934e68f630ca4a15fffcd6/index.js#L81-L95
		if (isNaN(length) && h['transfer-encoding'] == null) {
			return fulfil(null);
		}

		let data = new Uint8Array(length || 0);

		if (length > 0) {
			let offset = 0;
			req.on('data', (chunk) => {
				const new_len = offset + Buffer.byteLength(chunk);

				if (new_len > length) {
					return reject({
						status: 413,
						reason: 'Exceeded "Content-Length" limit',
					});
				}

				data.set(chunk, offset);
				offset = new_len;
			});
		} else {
			req.on('data', (chunk) => {
				const new_data = new Uint8Array(data.length + chunk.length);
				new_data.set(data, 0);
				new_data.set(chunk, data.length);
				data = new_data;
			});
		}

		req.on('end', () => {
			fulfil(data);
		});
	});
}

export async function getRequest(base: string, req: IncomingMessage): Promise<Request> {
	let headers = req.headers as Record<string, string>;
	if (req.httpVersionMajor === 2) {
		// we need to strip out the HTTP/2 pseudo-headers because node-fetch's
		// Request implementation doesn't like them
		headers = Object.assign({}, headers);
		delete headers[':method'];
		delete headers[':path'];
		delete headers[':authority'];
		delete headers[':scheme'];
	}
	const request = new Request(base + req.url, {
		method: req.method,
		headers,
		body: await get_raw_body(req), // TODO stream rather than buffer
	});
	Reflect.set(request, clientAddressSymbol, headers['x-forwarded-for']);
	return request;
}

export async function setResponse(
	app: App,
	res: ServerResponse,
	response: Response
): Promise<void> {
	const headers = Object.fromEntries(response.headers);
	let setCookie: string[] = [];

	if (response.headers.has('set-cookie')) {
		// Special-case set-cookie which has to be set an different way :/
		// The fetch API does not have a way to get multiples of a single header, but instead concatenates
		// them. There are non-standard ways to do it, and node-fetch gives us headers.raw()
		// See https://github.com/whatwg/fetch/issues/973 for discussion
		if ('raw' in response.headers) {
			// Node fetch allows you to get the raw headers, which includes multiples of the same type.
			// This is needed because Set-Cookie *must* be called for each cookie, and can't be
			// concatenated together.
			type HeadersWithRaw = Headers & {
				raw: () => Record<string, string[]>;
			};

			const rawPacked = (response.headers as HeadersWithRaw).raw();
			if ('set-cookie' in rawPacked && setCookie.length === 0) {
				setCookie = rawPacked['set-cookie'];
			}
		} else {
			setCookie = [response.headers.get('set-cookie')!];
		}
	}

	// Apply cookies set via Astro.cookies.set/delete
	if (app.setCookieHeaders) {
		const setCookieHeaders = Array.from(app.setCookieHeaders(response));
		setCookie.push(...setCookieHeaders);
	}

	res.writeHead(response.status, {
		...headers,
		'Set-Cookie': setCookie,
	});

	if (response.body instanceof Readable) {
		response.body.pipe(res);
	} else {
		if (response.body) {
			res.write(await response.arrayBuffer());
		}

		res.end();
	}
}
