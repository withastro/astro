import { EventEmitter } from 'node:events';
import type { Server, ServerResponse } from 'node:http';
import * as httpMocks from 'node-mocks-http';
import {
	type AstroInlineConfig,
	type Fixture,
	type AdapterServer,
	type DevServer,
	loadFixture as baseLoadFixture,
} from '../../../astro/test/test-utils.js';
import type * as express from 'express';

process.env.ASTRO_NODE_AUTOSTART = 'disabled';
process.env.ASTRO_NODE_LOGGING = 'disabled';

export type { AstroInlineConfig, Fixture, AdapterServer, DevServer };

export function loadFixture(inlineConfig: AstroInlineConfig) {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	return baseLoadFixture({
		...inlineConfig,
		root: new URL(inlineConfig.root as string, import.meta.url).toString(),
	});
}

export function createRequestAndResponse(reqOptions?: httpMocks.RequestOptions): {
	req: httpMocks.MockRequest<express.Request>;
	res: httpMocks.MockResponse<ServerResponse>;
	done: Promise<Buffer<ArrayBufferLike>[]>;
	text: () => Promise<string>;
} {
	const req: httpMocks.MockRequest<express.Request> =
		httpMocks.createRequest<express.Request>(reqOptions);

	const res: httpMocks.MockResponse<ServerResponse> = httpMocks.createResponse<ServerResponse>({
		eventEmitter: EventEmitter,
		req,
	});

	const done: Promise<Buffer<ArrayBufferLike>[]> = toPromise(res);

	// Get the response as text
	const text: () => Promise<string> = async () => {
		const chunks = await done;
		return buffersToString(chunks);
	};

	return { req, res, done, text };
}

function toPromise(res: httpMocks.MockResponse<ServerResponse>): Promise<Array<Buffer>> {
	return new Promise((resolve) => {
		// node-mocks-http doesn't correctly handle non-Buffer typed arrays,
		// so override the write method to fix it.
		const write = res.write;
		res.write = function (data: any, encoding?: any) {
			if (ArrayBuffer.isView(data) && !Buffer.isBuffer(data)) {
				data = Buffer.from(data.buffer);
			}
			return write.call(this, data, encoding);
		};
		res.on('end', () => {
			const chunks = (res as any)._getChunks();
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

export function waitServerListen(server: Server): Promise<void> {
	return new Promise((resolve, reject) => {
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
