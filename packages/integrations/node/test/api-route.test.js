import nodejs from '../dist/index.js';
import { loadFixture, createRequestAndResponse } from './test-utils.js';
import { expect } from 'chai';
import crypto from 'node:crypto';

describe('API routes', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/api-route/',
			output: 'server',
			adapter: nodejs({ mode: 'middleware' }),
		});
		await fixture.build();
	});

	it('Can get the request body', async () => {
		const { handler } = await import('./fixtures/api-route/dist/server/entry.mjs');
		let { req, res, done } = createRequestAndResponse({
			method: 'POST',
			url: '/recipes',
		});

		req.once('async_iterator', () => {
			req.send(JSON.stringify({ id: 2 }));
		});

		handler(req, res);

		let [buffer] = await done;

		let json = JSON.parse(buffer.toString('utf-8'));

		expect(json.length).to.equal(1);

		expect(json[0].name).to.equal('Broccoli Soup');
	});

	it('Can get binary data', async () => {
		const { handler } = await import('./fixtures/api-route/dist/server/entry.mjs');

		let { req, res, done } = createRequestAndResponse({
			method: 'POST',
			url: '/binary',
		});

		req.once('async_iterator', () => {
			req.send(Buffer.from(new Uint8Array([1, 2, 3, 4, 5])));
		});

		handler(req, res);

		let [out] = await done;
		let arr = Array.from(new Uint8Array(out.buffer));
		expect(arr).to.deep.equal([5, 4, 3, 2, 1]);
	});

	it('Can post large binary data', async () => {
		const { handler } = await import('./fixtures/api-route/dist/server/entry.mjs');

		let { req, res, done } = createRequestAndResponse({
			method: 'POST',
			url: '/hash',
		});

		handler(req, res);

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

		let [out] = await done;
		expect(new Uint8Array(out.buffer)).to.deep.equal(expectedDigest);
	});
});
