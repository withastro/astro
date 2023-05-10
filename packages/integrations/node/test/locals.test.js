import nodejs from '../dist/index.js';
import { loadFixture, createRequestAndResponse } from './test-utils.js';
import { expect } from 'chai';

describe('API routes', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/locals/',
			output: 'server',
			adapter: nodejs({ mode: 'middleware' }),
		});
		await fixture.build();
	});

	it('Can render locals in page', async () => {
		const { handler } = await import('./fixtures/api-route/dist/server/entry.mjs');
		let { req, res, text } = createRequestAndResponse({
			method: 'POST',
			url: '/foo',
		});

		let locals = { foo: 'bar' };

		handler(req, res, () => {}, locals);
		req.send();

		let html = await text();

		expect(html).to.contain('<h1>bar</h1>');
	});

	it('Can access locals in API', async () => {
		const { handler } = await import('./fixtures/api-route/dist/server/entry.mjs');
		let { req, res, done } = createRequestAndResponse({
			method: 'POST',
			url: '/api',
		});

		let locals = { foo: 'bar' };

		handler(req, res, () => {}, locals);
		req.send();

		let [buffer] = await done;

		let json = JSON.parse(buffer.toString('utf-8'));

		expect(json.length).to.equal(1);
		expect(json[0].foo).to.equal('bar');
	});
});
