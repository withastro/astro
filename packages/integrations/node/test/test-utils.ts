import { EventEmitter } from 'node:events';
import httpMocks, { type RequestOptions } from 'node-mocks-http';
import { loadFixture as baseLoadFixture } from '../../../astro/test/test-utils.js';
import type { AstroInlineConfig } from '../../../astro/dist/types/public/config.js';
import type { Server } from 'node:http';

process.env.ASTRO_NODE_AUTOSTART = 'disabled';
process.env.ASTRO_NODE_LOGGING = 'disabled';

export function loadFixture(inlineConfig: AstroInlineConfig) {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	return baseLoadFixture({
		...inlineConfig,
		root: new URL(inlineConfig.root, import.meta.url).toString(),
	});
}

export function createRequestAndResponse(reqOptions: RequestOptions) {
	const req = httpMocks.createRequest(reqOptions);

	const res = httpMocks.createResponse({
		eventEmitter: EventEmitter,
		req,
	});

	const done = toPromise(res);

	// Get the response as text
	const text = async () => {
		const chunks = await done;
		return buffersToString(chunks);
	};

	return { req, res, done, text };
}

function toPromise(res: any) {
	return new Promise<Array<Buffer>>((resolve) => {
		// node-mocks-http doesn't correctly handle non-Buffer typed arrays,
		// so override the write method to fix it.
		const write = res.write;
		res.write = function (data: any, encoding: any) {
			if (ArrayBuffer.isView(data) && !Buffer.isBuffer(data)) {
				data = Buffer.from(data.buffer);
			}
			return write.call(this, data, encoding);
		};
		res.on('end', () => {
			const chunks = res._getChunks();
			resolve(chunks);
		});
	});
}

function buffersToString(buffers: Array<Buffer>) {
	const decoder = new TextDecoder();
	let str = '';
	for (const buffer of buffers) {
		str += decoder.decode(buffer);
	}
	return str;
}

export function waitServerListen(server: Server) {
	return new Promise<void>((resolve, reject) => {
		function onListen() {
			server.off('error', onError);
			resolve();
		}
		function onError(error: Error) {
			server.off('listening', onListen);
			reject(error);
		}
		server.once('listening', onListen);
		server.once('error', onError);
	});
}
