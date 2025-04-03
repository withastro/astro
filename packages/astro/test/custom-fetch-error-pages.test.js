import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Custom Fetch for Error Pages', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-fetch-error-pages/',
			output: 'server',
			adapter: testAdapter(),
			build: { inlineStylesheets: 'never' },
		});
	});

	describe('Production', () => {
		/** @type {import('./test-utils.js').App} */
		let app;

		// Mock fetch calls for tracking
		let fetchCalls = [];
		const customFetch = async (url) => {
			fetchCalls.push(url);
			// Return a custom response to verify our fetch was used
			return new Response('<html><body><h1>Custom Fetch Response</h1></body></html>', {
				headers: {
					'content-type': 'text/html',
				},
			});
		};

		before(async () => {
			await fixture.build({});
			app = await fixture.loadTestAdapterApp();
		});

		beforeEach(() => {
			// Reset fetch calls before each test
			fetchCalls = [];
		});

		it('uses custom fetch implementation in case the server needs to get pre-rendered error 404 page when provided via preRenderedFetch', async () => {
			const request = new Request('http://example.com/not-found');
			const response = await app.render(request, { prerenderedErrorPageFetch: customFetch });

			// Verify the response comes from our custom fetch
			assert.equal(response.status, 404);

			// Verify our custom fetch was called with the right URL
			assert.equal(fetchCalls.length, 1);
			assert.ok(fetchCalls[0].includes('/404'));

			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Custom Fetch Response');
		});

		it('uses custom fetch implementation for 500 errors', async () => {
			const request = new Request('http://example.com/causes-error');
			const response = await app.render(request, { prerenderedErrorPageFetch: customFetch });

			// Verify the response comes from our custom fetch
			assert.equal(response.status, 500);

			// Verify our custom fetch was called with the right URL
			assert.equal(fetchCalls.length, 1);
			assert.ok(fetchCalls[0].includes('/500'));

			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Custom Fetch Response');
		});

		it('falls back to global fetch when preRenderedFetch is not provided', async () => {
			const request = new Request('http://example.com/not-found');
			const response = await app.render(request);

			// Verify our custom fetch was NOT called
			assert.equal(fetchCalls.length, 0);

			// Response should be the default 404 page
			assert.equal(response.status, 404);
			const html = await response.text();
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Example Domain'); // actual fetch requesting example.com and gets that.
		});
	});
});
