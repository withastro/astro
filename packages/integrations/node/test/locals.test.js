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

	it('Can use locals added by node middleware', async () => {
		const { handler } = await import('./fixtures/locals/dist/server/entry.mjs');
		let { req, res, text } = createRequestAndResponse({
			url: '/from-node-middleware',
		});

		let locals = { foo: 'bar' };

		handler(req, res, () => {}, locals);
		req.send();

		let html = await text();

		expect(html).to.contain('<h1>bar</h1>');
	});

	it('Throws an error when provided non-objects as locals', async () => {
		const { handler } = await import('./fixtures/locals/dist/server/entry.mjs');
		let { req, res, done } = createRequestAndResponse({
			url: '/from-node-middleware',
		});

		handler(req, res, undefined, 'locals');
		req.send();

		await done;
		expect(res).to.deep.include({ statusCode: 500 });
	});

	it('Can use locals added by astro middleware', async () => {
		const { handler } = await import('./fixtures/locals/dist/server/entry.mjs');

		const { req, res, text } = createRequestAndResponse({
			url: '/from-astro-middleware',
		});

		handler(req, res, () => {});
		req.send();

		const html = await text();

		expect(html).to.contain('<h1>baz</h1>');
	});

	it('Can access locals in API', async () => {
		const { handler } = await import('./fixtures/locals/dist/server/entry.mjs');
		let { req, res, done } = createRequestAndResponse({
			method: 'POST',
			url: '/api',
		});

		let locals = { foo: 'bar' };

		handler(req, res, () => {}, locals);
		req.send();

		let [buffer] = await done;

		let json = JSON.parse(buffer.toString('utf-8'));

		expect(json.foo).to.equal('bar');
	});
});
