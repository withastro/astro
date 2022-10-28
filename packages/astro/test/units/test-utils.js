import httpMocks from 'node-mocks-http';
import { EventEmitter } from 'events';
import { Volume } from 'memfs';
import { fileURLToPath } from 'url';
import npath from 'path';
import { unixify } from './correct-path.js';

export function createFs(json, root) {
	if(typeof root !== 'string') {
		root = unixify(fileURLToPath(root));
	}

	const structure = {};
	for(const [key, value] of Object.entries(json)) {
		const fullpath = npath.join(root, key);
		structure[fullpath] = value;
	}

	return Volume.fromJSON(structure);
}

export function createRequestAndResponse(reqOptions = {}) {
	const req = httpMocks.createRequest(reqOptions);

	const res = httpMocks.createResponse({
		eventEmitter: EventEmitter,
		req,
	});

	// When the response is complete.
	const done = toPromise(res);

	// Get the response as text
	const text = async () => {
		let chunks = await done;
		return buffersToString(chunks);
	};

	// Get the response as json
	const json = async () => {
		const raw = await text();
		return JSON.parse(raw);
	};

	return { req, res, done, json, text };
}

export function toPromise(res) {
	return new Promise((resolve) => {
		// node-mocks-http doesn't correctly handle non-Buffer typed arrays,
		// so override the write method to fix it.
		const write = res.write;
		res.write = function(data, encoding) {
			if(ArrayBuffer.isView(data) && !Buffer.isBuffer(data)) {
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

export function buffersToString(buffers) {
	let decoder = new TextDecoder();
	let str = '';
	for(const buffer of buffers) {
		str += decoder.decode(buffer);
	}
	return str;
}

// A convenience method for creating an astro module from a component
export const createAstroModule = (AstroComponent) => ({ default: AstroComponent });
