/**
 * Lightweight helpers for integration tests that need mock HTTP
 * request/response objects. Extracted from units/test-utils.ts so
 * that JS integration tests don't cross-import from the TS unit-test
 * helpers.
 */
import { EventEmitter } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import httpMocks from 'node-mocks-http';

export function createRequestAndResponse(reqOptions: httpMocks.RequestOptions = {}) {
	const req: IncomingMessage = httpMocks.createRequest(reqOptions);
	req.headers.host ||= 'localhost';

	const res: ServerResponse<IncomingMessage> = httpMocks.createResponse({
		eventEmitter: EventEmitter,
		req,
	});

	// Cast needed because node-mocks-http's type declarations don't expose
	// EventEmitter methods or _getChunks(), even though they exist at runtime.
	const done = toPromise(res as unknown as MockRes);

	const text = async () => {
		const chunks = await done;
		return buffersToString(chunks);
	};

	const json = async () => {
		const raw = await text();
		return JSON.parse(raw);
	};

	return { req, res, done, json, text };
}

// node-mocks-http types are intentionally loose — the mock response supports
// EventEmitter methods and internal helpers like _getChunks() that aren't in
// the public type declarations. We use a loose interface here to avoid fighting
// the mock library's types.
interface MockRes {
	write: (data: Buffer | string, encoding?: BufferEncoding) => boolean;
	on: (event: string, cb: () => void) => void;
	_getChunks: () => Buffer[];
}

function toPromise(res: MockRes): Promise<Buffer[]> {
	return new Promise((resolve) => {
		// node-mocks-http doesn't correctly handle non-Buffer typed arrays,
		// so override the write method to fix it.
		const write = res.write;
		res.write = function (data: Buffer | string | ArrayBufferView, encoding?: BufferEncoding) {
			if (ArrayBuffer.isView(data) && !Buffer.isBuffer(data)) {
				data = Buffer.from(data.buffer as ArrayBuffer);
			}
			if (typeof data === 'string') {
				data = Buffer.from(data);
			}
			return write.call(this, data as Buffer, encoding);
		};
		res.on('end', () => {
			const chunks = res._getChunks();
			resolve(chunks);
		});
	});
}

function buffersToString(buffers: Buffer[]): string {
	const decoder = new TextDecoder();
	let str = '';
	for (const buffer of buffers) {
		str += decoder.decode(buffer);
	}
	return str;
}
