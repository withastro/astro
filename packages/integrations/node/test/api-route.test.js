import * as assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { before, describe, it } from 'node:test';
import node from '../dist/index.js';
import { createRequestAndResponse, loadFixture } from './test-utils.js';

describe('API routes', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/api-route/',
			output: 'server',
			adapter: node({
				serverEntrypoint: '@astrojs/node/node-handler',
			}),
		});
		await fixture.build();
	});

	it('Can get the request body', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule()
		const { req, res, done } = createRequestAndResponse({
			method: 'POST',
			url: '/recipes',
		});

		req.once('async_iterator', () => {
			req.send(JSON.stringify({ id: 2 }));
		});

		nodeHandler(req, res);

		const [buffer] = await done;

		const json = JSON.parse(buffer.toString('utf-8'));

		assert.equal(json.length, 1);

		assert.equal(json[0].name, 'Broccoli Soup');
	});

	it('Can get binary data', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule()

		const { req, res, done } = createRequestAndResponse({
			method: 'POST',
			url: '/binary',
		});

		req.once('async_iterator', () => {
			req.send(Buffer.from(new Uint8Array([1, 2, 3, 4, 5])));
		});

		nodeHandler(req, res);

		const [out] = await done;
		const arr = Array.from(new Uint8Array(out.buffer));
		assert.deepEqual(arr, [5, 4, 3, 2, 1]);
	});

	it('Can post large binary data', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule()

		const { req, res, done } = createRequestAndResponse({
			method: 'POST',
			url: '/hash',
		});

		nodeHandler(req, res);

		let expectedDigest = null;
		req.once('async_iterator', () => {
			// Send 256MB of garbage data in 256KB chunks. This should be fast (< 1sec).
			let remainingBytes = 256 * 1024 * 1024;
			const chunkSize = 256 * 1024;

			const hash = crypto.createHash('sha256');
			while (remainingBytes > 0) {
				const size = Math.min(remainingBytes, chunkSize);
				const chunk = Buffer.alloc(size, Math.floor(Math.random() * 256));
				hash.update(chunk);
				req.emit('data', chunk);
				remainingBytes -= size;
			}

			req.emit('end');
			expectedDigest = hash.digest();
		});

		const [out] = await done;
		assert.deepEqual(new Uint8Array(out.buffer), new Uint8Array(expectedDigest));
	});

	it('Can bail on streaming', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule()
		const { req, res, done } = createRequestAndResponse({
			url: '/streaming',
		});

		const locals = { cancelledByTheServer: false };

		nodeHandler(req, res, () => {}, locals);
		req.send();

		await new Promise((resolve) => setTimeout(resolve, 500));
		res.emit('close');

		await done;

		assert.deepEqual(locals, { cancelledByTheServer: true });
	});

	it('Can respond with SSR redirect', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule()
		const { req, res, done } = createRequestAndResponse({
			url: '/redirect',
		});

		nodeHandler(req, res);
		req.send();

		await done;

		assert.equal(res.statusCode, 302);
		assert.equal(res.getHeader('location'), '/destination');
	});

	it('Can respond with Astro.redirect', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule()
		const { req, res, done } = createRequestAndResponse({
			url: '/astro-redirect',
		});

		nodeHandler(req, res);
		req.send();

		await done;

		assert.equal(res.statusCode, 303);
		assert.equal(res.getHeader('location'), '/destination');
	});

	it('Can respond with Response.redirect', async () => {
		const { nodeHandler } = await fixture.loadAdapterEntryModule()
		const { req, res, done } = createRequestAndResponse({
			url: '/response-redirect',
		});

		nodeHandler(req, res);
		req.send();

		await done;

		assert.equal(res.statusCode, 307);
		assert.equal(res.getHeader('location'), 'http://localhost/destination');
	});
});
