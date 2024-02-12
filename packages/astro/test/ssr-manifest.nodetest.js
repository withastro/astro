import assert from 'node:assert/strict';
import { describe, before, it } from 'node:test';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';
import * as cheerio from 'cheerio';

describe('astro:ssr-manifest', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-manifest/',
			output: 'server',
			adapter: testAdapter(),
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build();
	});

	it('works', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();

		const $ = cheerio.load(html);
		assert.match($('#assets').text(), /\["\/_astro\/index.([\w-]{8})\.css"\]/);
	});

	it('includes compressHTML', async () => {
		const app = await fixture.loadTestAdapterApp();
		assert.equal(app.manifest.compressHTML, true);
		assert.equal(app.manifest.compressHTML, true);
	});
});
