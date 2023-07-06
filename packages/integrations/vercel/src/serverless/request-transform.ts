import type { App } from 'astro/app';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { splitCookiesString } from 'set-cookie-parser';

const clientAddressSymbol = Symbol.for('astro.clientAddress');

/*
  Credits to the SvelteKit team
	https://github.com/sveltejs/kit/blob/8d1ba04825a540324bc003e85f36559a594aadc2/packages/kit/src/exports/node/index.js
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
			throw new HTTPError(
				413,
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
						new HTTPError(
							413,
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
	let request = new Request(base + req.url, {
		// @ts-expect-error -- duplex does exist in Vercel requests
		duplex: 'half',
		method: req.method,
		headers,
		body: get_raw_body(req, bodySizeLimit),
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
	let cookies: string[] = [];

	if (response.headers.has('set-cookie')) {
		const header = response.headers.get('set-cookie')!;
		const split = splitCookiesString(header);
		cookies = split;
	}

	if (app.setCookieHeaders) {
		for (const setCookieHeader of app.setCookieHeaders(response)) {
			cookies.push(setCookieHeader);
		}
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

class HTTPError extends Error {
	status: number;

	constructor(status: number, reason: string) {
		super(reason);
		this.status = status;
	}

	get reason() {
		return super.message;
	}
}
