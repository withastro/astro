import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('Multiple Dynamic Routes Style Propagation', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-multiple-dynamic-routes/',
			output: 'server',
			adapter: testAdapter(),
			build: { inlineStylesheets: 'never' }, // Ensure styles are linked, not inlined
		});
		await fixture.build();
	});

	async function fetchHTML(path) {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com' + path);
		const response = await app.render(request);
		const html = await response.text();
		return html;
	}

	it('First dynamic route [...slug] includes page styles', async () => {
		const html = await fetchHTML('/test');
		const $ = cheerioLoad(html);
		
		// Check that styles are present
		assert.ok($('style').length > 0 || $('link[rel="stylesheet"]').length > 0, 
			'Expected styles to be present in [...slug] route');
		
		// Check that the slug content is blue
		assert.ok(html.includes('color: blue') || html.includes('color:blue'), 
			'Expected slug-specific styles to be present');
	});

	it('Second dynamic route [...skug] includes page styles', async () => {
		const html = await fetchHTML('/test-skug');
		const $ = cheerioLoad(html);
		
		// Check that styles are present - this is the bug fix
		assert.ok($('style').length > 0 || $('link[rel="stylesheet"]').length > 0, 
			'Expected styles to be present in [...skug] route');
		
		// Check that the skug content is red
		assert.ok(html.includes('color: red') || html.includes('color:red'), 
			'Expected skug-specific styles to be present');
	});

	it('Both routes handle content collection styles', async () => {
		// Test that both routes can handle content collection styles
		const slugHtml = await fetchHTML('/test');
		const skugHtml = await fetchHTML('/test-skug');
		
		// Both should have some form of styling
		const slugHasStyles = cheerioLoad(slugHtml)('style').length > 0 || 
			cheerioLoad(slugHtml)('link[rel="stylesheet"]').length > 0;
		const skugHasStyles = cheerioLoad(skugHtml)('style').length > 0 || 
			cheerioLoad(skugHtml)('link[rel="stylesheet"]').length > 0;
		
		assert.ok(slugHasStyles, 'slug route should have styles');
		assert.ok(skugHasStyles, 'skug route should have styles');
	});
});