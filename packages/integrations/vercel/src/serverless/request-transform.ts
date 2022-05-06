import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';

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
	return new Request(base + req.url, {
		method: req.method,
		headers,
		body: await get_raw_body(req), // TODO stream rather than buffer
	});
}

export async function setResponse(res: ServerResponse, response: Response): Promise<void> {
	const headers = Object.fromEntries(response.headers);

	if (response.headers.has('set-cookie')) {
		// @ts-expect-error (headers.raw() is non-standard)
		headers['set-cookie'] = response.headers.raw()['set-cookie'];
	}

	res.writeHead(response.status, headers);

	if (response.body instanceof Readable) {
		response.body.pipe(res);
	} else {
		if (response.body) {
			res.write(await response.arrayBuffer());
		}

		res.end();
	}
}
