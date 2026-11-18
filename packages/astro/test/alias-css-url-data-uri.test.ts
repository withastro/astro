import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

// Regression test for https://github.com/withastro/astro/issues/17293
// CSS url() with data URIs should not crash when tsconfig baseUrl is set.
describe('CSS url() with data URIs and tsconfig baseUrl', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/alias-css-url-data-uri/',
		});
		await fixture.build();
	});

	it('preserves data URIs in url() without ENAMETOOLONG crash', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const styleTag = $('style').html() || '';
		assert.ok(styleTag.includes('data:image/svg+xml;base64,'), 'CSS should preserve the data URI');
	});
});
