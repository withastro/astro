// @ts-check
import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import node from '../dist/index.js';
import { loadFixture } from './test-utils.js';

describe('prerenderedErrorPageFetch', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('astro').PreviewServer} */
	let devPreview;
	/** @type {typeof globalThis.fetch} */
	let originalFetch;
	/** @type {Array<string>} */
	let urls;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/prerendered-error-page-fetch/',
			adapter: node({ mode: 'standalone' }),
		});
		await fixture.clean();
		await fixture.build({});
		devPreview = await fixture.preview({});
		originalFetch = globalThis.fetch;
		globalThis.fetch = (...args) => {
			urls ??= [];
			if (typeof args[0] === 'string') {
				urls.push(args[0]);
			}
			return originalFetch(...args);
		};
	});

	after(async () => {
		await devPreview.stop();
		globalThis.fetch = originalFetch;
	});

	it('requests prerendered 404 page', async () => {
		urls = [];
		const response = await fixture.fetch('/nonexistent');
		const text = await response.text();
		assert.ok(text.includes('Custom 404 Page'), 'Should serve error page content from disk');
		assert.ok(!urls.some((url) => url.endsWith('404.html')));
	});
	it('requests prerendered 500 page', async () => {
		urls = [];
		const response = await fixture.fetch('/error?error=true');
		const text = await response.text();
		assert.ok(text.includes('Custom 500 Page'), 'Should serve error page content from disk');
		assert.ok(!urls.some((url) => url.endsWith('500.html')));
	});
});
