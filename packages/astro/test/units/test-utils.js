import httpMocks from 'node-mocks-http';
import { EventEmitter } from 'events';
import { Volume } from 'memfs';
import { fileURLToPath } from 'url';
import npath from 'path';
import { unixify } from './correct-path.js';

class MyVolume extends Volume {
	#root = '';
	constructor(root) {
		super();
		this.#root = root;
	}

	#forcePath(p) {
		if (p instanceof URL) {
			p = unixify(fileURLToPath(p));
		} else {
			p = unixify(p);
		}
		return p;
	}

	getFullyResolvedPath(pth) {
		return npath.posix.join(this.#root, pth);
	}

	existsSync(p) {
		return super.existsSync(this.#forcePath(p));
	}

	readFile(p, ...args) {
		return super.readFile(this.#forcePath(p), ...args);
	}

	writeFileFromRootSync(pth, ...rest) {
		return super.writeFileSync(this.getFullyResolvedPath(pth), ...rest);
	}
}

export function createFs(json, root) {
	if (typeof root !== 'string') {
		root = unixify(fileURLToPath(root));
	}

	const structure = {};
	for (const [key, value] of Object.entries(json)) {
		const fullpath = npath.posix.join(root, key);
		structure[fullpath] = value;
	}

	const fs = new MyVolume(root);
	fs.fromJSON(structure);
	return fs;
}

/**
 *
 * @param {import('../../src/core/dev/container').Container} container
 * @param {typeof import('fs')} fs
 * @param {string} shortPath
 * @param {'change'} eventType
 */
export function triggerFSEvent(container, fs, shortPath, eventType) {
	container.viteServer.watcher.emit(eventType, fs.getFullyResolvedPath(shortPath));

	if (!fileURLToPath(container.settings.config.root).startsWith('/')) {
		const drive = fileURLToPath(container.settings.config.root).slice(0, 2);
		container.viteServer.watcher.emit(eventType, drive + fs.getFullyResolvedPath(shortPath));
	}
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
		res.write = function (data, encoding) {
			if (ArrayBuffer.isView(data) && !Buffer.isBuffer(data)) {
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
	for (const buffer of buffers) {
		str += decoder.decode(buffer);
	}
	return str;
}

// A convenience method for creating an astro module from a component
export const createAstroModule = (AstroComponent) => ({ default: AstroComponent });
