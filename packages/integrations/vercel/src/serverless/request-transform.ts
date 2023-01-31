import type { App } from 'astro/app';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { splitCookiesString } from 'set-cookie-parser';

const clientAddressSymbol = Symbol.for('astro.clientAddress');

/*
  Credits to the SvelteKit team
	https://github.com/sveltejs/kit/blob/dd380b38c322272b414a7ec3ac2911f2db353f5c/packages/kit/src/exports/node/index.js
*/

function get_raw_body(req: IncomingMessage, body_size_limit?: number): ReadableStream | null {
	const h = req.headers;

	if (!h['content-type']) {
		return null;
	}

	const content_length = Number(h['content-length']);

	// check if no request body
	if (
		(req.httpVersionMajor === 1 && isNaN(content_length) && h['transfer-encoding'] == null) ||
		content_length === 0
	) {
		return null;
	}

	let length = content_length;

	if (body_size_limit) {
		if (!length) {
			length = body_size_limit;
		} else if (length > body_size_limit) {
			throw new Error(
				`Received content-length of ${length}, but only accept up to ${body_size_limit} bytes.`
			);
		}
	}

	if (req.destroyed) {
		const readable = new ReadableStream();
		readable.cancel();
		return readable;
	}

	let size = 0;
	let cancelled = false;

	return new ReadableStream({
		start(controller) {
			req.on('error', (error) => {
				cancelled = true;
				controller.error(error);
			});

			req.on('end', () => {
				if (cancelled) return;
				controller.close();
			});

			req.on('data', (chunk) => {
				if (cancelled) return;

				size += chunk.length;
				if (size > length) {
					cancelled = true;
					controller.error(
						new Error(
							`request body size exceeded ${
								content_length ? "'content-length'" : 'BODY_SIZE_LIMIT'
							} of ${length}`
						)
					);
					return;
				}

				controller.enqueue(chunk);

				if (controller.desiredSize === null || controller.desiredSize <= 0) {
					req.pause();
				}
			});
		},

		pull() {
			req.resume();
		},

		cancel(reason) {
			cancelled = true;
			req.destroy(reason);
		},
	});
}

export async function getRequest(
	base: string,
	req: IncomingMessage,
	bodySizeLimit?: number
): Promise<Request> {
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
		body: get_raw_body(req, bodySizeLimit),
	});
	Reflect.set(request, clientAddressSymbol, headers['x-forwarded-for']);
	return request;
}

export async function setResponse(app: App, res: ServerResponse, response: Response) {
	const headers = Object.fromEntries(response.headers);
	let cookies: string[] = [];

	if (response.headers.has('set-cookie')) {
		const header = response.headers.get('set-cookie')!;
		const split = splitCookiesString(header);
		cookies = split;
	}

	if (app.setCookieHeaders) {
		const setCookieHeaders = Array.from(app.setCookieHeaders(response));
		cookies.push(...setCookieHeaders);
	}

	res.writeHead(response.status, { ...headers, 'set-cookie': cookies });

	if (!response.body) {
		res.end();
		return;
	}

	if (response.body.locked) {
		res.write(
			'Fatal error: Response body is locked. ' +
				`This can happen when the response was already read (for example through 'response.json()' or 'response.text()').`
		);
		res.end();
		return;
	}

	const reader = response.body.getReader();

	if (res.destroyed) {
		reader.cancel();
		return;
	}

	const cancel = (error?: Error) => {
		res.off('close', cancel);
		res.off('error', cancel);

		// If the reader has already been interrupted with an error earlier,
		// then it will appear here, it is useless, but it needs to be catch.
		reader.cancel(error).catch(() => {});
		if (error) res.destroy(error);
	};

	res.on('close', cancel);
	res.on('error', cancel);

	next();
	async function next() {
		try {
			for (;;) {
				const { done, value } = await reader.read();

				if (done) break;

				if (!res.write(value)) {
					res.once('drain', next);
					return;
				}
			}
			res.end();
		} catch (error) {
			cancel(error instanceof Error ? error : new Error(String(error)));
		}
	}
}
