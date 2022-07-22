import { loadFixture as baseLoadFixture } from '../../../astro/test/test-utils.js';
import httpMocks from 'node-mocks-http';
import { EventEmitter } from 'events';

/**
 * @typedef {import('../../../astro/test/test-utils').Fixture} Fixture
 */

export function loadFixture(inlineConfig) {
	if (!inlineConfig || !inlineConfig.root)
		throw new Error("Must provide { root: './fixtures/...' }");

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	return baseLoadFixture({
		...inlineConfig,
		root: new URL(inlineConfig.root, import.meta.url).toString(),
	});
}

export function createRequestAndResponse(reqOptions) {
	let req = httpMocks.createRequest(reqOptions);

	let res = httpMocks.createResponse({
		eventEmitter: EventEmitter,
		req,
	});

	let done = toPromise(res);

	return { req, res, done };
}

export function toPromise(res) {
	return new Promise((resolve) => {
		res.on('end', () => {
			let chunks = res._getChunks();
			resolve(chunks);
		});
	});
}
