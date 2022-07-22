import nodejs from '../dist/index.js';
import { loadFixture, createRequestAndResponse, toPromise } from './test-utils.js';
import { expect } from 'chai';

describe('API routes', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/api-route/',
			experimental: {
				ssr: true,
			},
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
});
