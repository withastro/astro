import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Astro.params in SSR', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-params/',
			adapter: testAdapter(),
			output: 'server',
			base: '/users/houston/',
		});
		await fixture.build();
	});

	it('Params are passed to component', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/users/houston/food');
		const response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerio.load(html);
		assert.equal($('.category').text(), 'food');
	});

	describe('Non-english characters in the URL', () => {
		it('Params are passed to component', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/users/houston/東西/food');
			const response = await app.render(request);
			assert.equal(response.status, 200);
			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('.category').text(), 'food');
		});
	});

	it('No double URL decoding', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/users/houston/%25%23%3F');
		const response = await app.render(request);
		assert.equal(response.status, 200);
		const html = await response.text();
		const $ = cheerio.load(html);
		assert.equal($('.category').text(), '%#?');
	});
});
