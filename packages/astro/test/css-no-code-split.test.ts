import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('vite.build.cssCodeSplit: false', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/css-no-code-split/',
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
			outDir: './dist/css-no-code-split/',
		});
		await fixture.build();
	});

	it('loads styles correctly', async () => {
		let html = await fixture.readFile('/index.html');
		let $ = cheerio.load(html);
		const cssHref = $('link[rel=stylesheet][href^=/_astro/]').attr('href')!;
		assert.match(cssHref, /\/_astro\/style\..*?\.css/);
	});
});
