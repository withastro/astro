import nodejs from '../dist/index.js';
import { loadFixture, createRequestAndResponse, toPromise } from './test-utils.js';
import { expect } from 'chai';

describe('API routes', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/api-route/',
			output: 'server',
			adapter: nodejs(),
		});
		await fixture.build();
	});

	it('Can get the request body', async () => {
		const { handler } = await import('./fixtures/api-route/dist/server/entry.mjs');

		let { req, res, done } = createRequestAndResponse({
			method: 'POST',
			url: '/recipes',
		});

		handler(req, res);
		req.send(JSON.stringify({ id: 2 }));

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

		handler(req, res);
		req.send(Buffer.from(new Uint8Array([1, 2, 3, 4, 5])));

		let [out] = await done;
		let arr = Array.from(new Uint8Array(out.buffer));
		expect(arr).to.deep.equal([5, 4, 3, 2, 1]);
	});
});
