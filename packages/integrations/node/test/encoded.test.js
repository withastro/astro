import nodejs from '../dist/index.js';
import { loadFixture, createRequestAndResponse } from './test-utils.js';
import { expect } from 'chai';

describe('Encoded Pathname', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/encoded/',
			output: 'server',
			adapter: nodejs({ mode: 'middleware' }),
		});
		await fixture.build();
	});

	it('Can get an Astro file', async () => {
		const { handler } = await import('./fixtures/encoded/dist/server/entry.mjs');
		let { req, res, text } = createRequestAndResponse({
			url: '/什么',
		});

		handler(req, res);
		req.send();

		const html = await text();
		expect(html).to.include('什么</h1>');
	});

	it('Can get a Markdown file', async () => {
		const { handler } = await import('./fixtures/encoded/dist/server/entry.mjs');

		let { req, res, text } = createRequestAndResponse({
			url: '/blog/什么',
		});

		handler(req, res);
		req.send();

		const html = await text();
		expect(html).to.include('什么</h1>');
	});
});
