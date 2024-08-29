import { EventEmitter } from 'node:events';
import { loadFixture as baseLoadFixture } from '@astrojs/test-utils';
import httpMocks from 'node-mocks-http';

process.env.ASTRO_NODE_AUTOSTART = 'disabled';
process.env.ASTRO_NODE_LOGGING = 'disabled';
/**
 * @typedef {import('../../../astro/test/test-utils').Fixture} Fixture
 */

export function loadFixture(inlineConfig) {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	return baseLoadFixture({
		...inlineConfig,
		root: new URL(inlineConfig.root, import.meta.url).toString(),
	});
}

export function createRequestAndResponse(reqOptions) {
	// biome-ignore lint/style/useConst: <explanation>
	let req = httpMocks.createRequest(reqOptions);

	// biome-ignore lint/style/useConst: <explanation>
	let res = httpMocks.createResponse({
		eventEmitter: EventEmitter,
		req,
	});

	// biome-ignore lint/style/useConst: <explanation>
	let done = toPromise(res);

	// Get the response as text
	const text = async () => {
		// biome-ignore lint/style/useConst: <explanation>
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
				// biome-ignore lint/style/noParameterAssign: <explanation>
				data = Buffer.from(data.buffer);
			}
			return write.call(this, data, encoding);
		};
		res.on('end', () => {
			// biome-ignore lint/style/useConst: <explanation>
			let chunks = res._getChunks();
			resolve(chunks);
		});
	});
}

export function buffersToString(buffers) {
	// biome-ignore lint/style/useConst: <explanation>
	let decoder = new TextDecoder();
	let str = '';
	for (const buffer of buffers) {
		str += decoder.decode(buffer);
	}
	return str;
}

export function waitServerListen(server) {
	return new Promise((resolve, reject) => {
		function onListen() {
			server.off('error', onError);
			resolve();
		}
		function onError(error) {
			server.off('listening', onListen);
			reject(error);
		}
		server.once('listening', onListen);
		server.once('error', onError);
	});
}
