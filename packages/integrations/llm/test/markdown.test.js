import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Markdown conversion', () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;
	let app;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basic/',
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('returns HTML by default', async () => {
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();
		const contentType = response.headers.get('content-type');

		assert.ok(contentType.includes('text/html'));
		assert.ok(html.includes('<h1>'));
		assert.ok(html.includes('<nav>'));
	});

	it('converts to markdown when Accept header includes text/markdown', async () => {
		const request = new Request('http://example.com/', {
			headers: {
				'Accept': 'text/markdown',
			},
		});
		const response = await app.render(request);
		const markdown = await response.text();
		const contentType = response.headers.get('content-type');

		assert.ok(contentType.includes('text/markdown'));
		assert.ok(markdown.includes('# Welcome to Astro'));
		assert.ok(!markdown.includes('<h1>'));
	});

	it('strips nav and footer elements', async () => {
		const request = new Request('http://example.com/', {
			headers: {
				'Accept': 'text/markdown',
			},
		});
		const response = await app.render(request);
		const markdown = await response.text();

		// Nav and footer should be removed by turndown config
		assert.ok(!markdown.includes('Home'));
		assert.ok(!markdown.includes('Copyright'));
	});

	it('preserves list items', async () => {
		const request = new Request('http://example.com/', {
			headers: {
				'Accept': 'text/markdown',
			},
		});
		const response = await app.render(request);
		const markdown = await response.text();

		assert.ok(markdown.includes('Item 1'));
		assert.ok(markdown.includes('Item 2'));
	});
});
