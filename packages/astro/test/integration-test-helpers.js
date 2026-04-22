/**
 * Lightweight helpers for integration tests that need mock HTTP
 * request/response objects. Extracted from units/test-utils.ts so
 * that JS integration tests don't cross-import from the TS unit-test
 * helpers.
 */
import { EventEmitter } from 'node:events';
import httpMocks from 'node-mocks-http';

/**
 * @param {Parameters<typeof httpMocks.createRequest>[0]} [reqOptions]
 * @returns {{
 *   req: import('node:http').IncomingMessage & { headers: Record<string, string | undefined> };
 *   res: import('node:http').ServerResponse & { _getChunks(): Buffer[]; on(event: 'end', listener: () => void): any };
 *   done: Promise<Buffer[]>;
 *   json: () => Promise<any>;
 *   text: () => Promise<string>;
 * }}
 */
export function createRequestAndResponse(reqOptions = {}) {
	const req = httpMocks.createRequest(reqOptions);
	req.headers.host ||= 'localhost';

	const res = httpMocks.createResponse({
		eventEmitter: EventEmitter,
		req,
	});

	const done = toPromise(res);

	const text = async () => {
		let chunks = await done;
		return buffersToString(chunks);
	};

	const json = async () => {
		const raw = await text();
		return JSON.parse(raw);
	};

	return { req, res, done, json, text };
}

function toPromise(res) {
	return new Promise((resolve) => {
		const write = res.write;
		res.write = function (data, encoding) {
			if (ArrayBuffer.isView(data) && !Buffer.isBuffer(data)) {
				data = Buffer.from(data.buffer);
			}
			if (typeof data === 'string') {
				data = Buffer.from(data);
			}
			return write.call(this, data, encoding);
		};
		res.on('end', () => {
			let chunks = res._getChunks();
			resolve(chunks);
		});
	});
}

function buffersToString(buffers) {
	let decoder = new TextDecoder();
	let str = '';
	for (const buffer of buffers) {
		str += decoder.decode(buffer);
	}
	return str;
}
