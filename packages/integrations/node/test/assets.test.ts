import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { PreviewServer } from '../../../astro/src/types/public/preview.js';
import * as cheerio from 'cheerio';
import nodejs from '../dist/index.js';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Assets', () => {
	let fixture: Fixture;
	let devPreview: PreviewServer;

	before(async () => {
		const root = new URL('./fixtures/image/', import.meta.url);
		fixture = await loadFixture({
			root,
			outDir: fileURLToPath(new URL('./dist/assets/', root)),
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
			vite: {
				build: {
					assetsInlineLimit: 0,
				},
			},
		});
		await fixture.build();
		devPreview = await fixture.preview();
	});

	after(async () => {
		await devPreview.stop();
	});

	it('Assets within the _astro folder should be given immutable headers', async () => {
		let response = await fixture.fetch('/text-file');
		let cacheControl = response.headers.get('cache-control');
		assert.equal(cacheControl, null);
		const html = await response.text();
		const $ = cheerio.load(html);

		// Fetch the asset
		const fileURL = $('a').attr('href')!;
		response = await fixture.fetch(fileURL);
		cacheControl = response.headers.get('cache-control');
		assert.equal(cacheControl, 'public, max-age=31536000, immutable');
	});

	it('Malformed If-Match header should return 412 without immutable cache headers', async () => {
		// First, get a valid asset URL from the page
		let response = await fixture.fetch('/text-file');
		const html = await response.text();
		const $ = cheerio.load(html);
		const fileURL = $('a').attr('href')!;

		// Send a request with a malformed If-Match header that won't match the ETag
		response = await fixture.fetch(fileURL, {
			headers: { 'If-Match': 'xxx' },
		});

		// Should return 412 Precondition Failed, not 500
		assert.equal(response.status, 412);

		// Must NOT include the immutable far-future cache header on error responses,
		// as that would allow CDN cache poisoning. The `send` library may still set
		// its own default `public, max-age=0` which is harmless (not cached).
		const cacheControl = response.headers.get('cache-control');
		assert.notEqual(cacheControl, 'public, max-age=31536000, immutable');
	});
});
