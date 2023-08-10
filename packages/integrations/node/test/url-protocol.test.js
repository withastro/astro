import { expect } from 'chai';
import { TLSSocket } from 'node:tls';
import nodejs from '../dist/index.js';
import { createRequestAndResponse, loadFixture } from './test-utils.js';

describe('URL protocol', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/url-protocol/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
	});

	it('return http when non-secure', async () => {
		const { handler } = await import('./fixtures/url-protocol/dist/server/entry.mjs');
		let { req, res, text } = createRequestAndResponse({
			url: '/',
		});

		handler(req, res);
		req.send();

		const html = await text();
		expect(html).to.include('http:');
	});

	it('return https when secure', async () => {
		const { handler } = await import('./fixtures/url-protocol/dist/server/entry.mjs');
		let { req, res, text } = createRequestAndResponse({
			socket: new TLSSocket(),
			url: '/',
		});

		handler(req, res);
		req.send();

		const html = await text();
		expect(html).to.include('https:');
	});

	it('return http when the X-Forwarded-Proto header is set to http', async () => {
		const { handler } = await import('./fixtures/url-protocol/dist/server/entry.mjs');
		let { req, res, text } = createRequestAndResponse({
			headers: { 'X-Forwarded-Proto': 'http' },
			url: '/',
		});

		handler(req, res);
		req.send();

		const html = await text();
		expect(html).to.include('http:');
	});

	it('return https when the X-Forwarded-Proto header is set to https', async () => {
		const { handler } = await import('./fixtures/url-protocol/dist/server/entry.mjs');
		let { req, res, text } = createRequestAndResponse({
			headers: { 'X-Forwarded-Proto': 'https' },
			url: '/',
		});

		handler(req, res);
		req.send();

		const html = await text();
		expect(html).to.include('https:');
	});
});
