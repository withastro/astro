import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
export { loadFixture } from '../../../astro/test/test-utils.js';

export function createRequestAndResponse(reqOptions) {
	let req = httpMocks.createRequest(reqOptions);

	let res = httpMocks.createResponse({
		eventEmitter: EventEmitter,
		req,
	});

	let done = toPromise(res);

	// Get the response as text
	const text = async () => {
		let chunks = await done;
		return buffersToString(chunks);
	};

	return { req, res, done, text };
}

export function toPromise(res) {
	return new Promise((resolve) => {
		// node-mocks-http doesn't correctly handle non-Buffer typed arrays,
		// so override the write method to fix it.
		const write = res.write;
		res.write = function (data, encoding) {
			if (ArrayBuffer.isView(data) && !Buffer.isBuffer(data)) {
				data = Buffer.from(data.buffer);
			}
			return write.call(this, data, encoding);
		};
		res.on('end', () => {
			let chunks = res._getChunks();
			resolve(chunks);
		});
	});
}

export function buffersToString(buffers) {
	let decoder = new TextDecoder();
	let str = '';
	for (const buffer of buffers) {
		str += decoder.decode(buffer);
	}
	return str;
}
