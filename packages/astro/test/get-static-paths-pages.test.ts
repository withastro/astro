import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { fixture } from './preludes/standard-static.prelude.ts';

describe('getStaticPaths with trailingSlash: ignore', () => {
	it('includes index page', async () => {
		let html = await fixture.readFile('/get-static-paths-pages/index.html');
		let $ = cheerio.load(html);
		assert.equal($('h1').text(), 'Page 1');
	});

	it('includes paginated page', async () => {
		let html = await fixture.readFile('/get-static-paths-pages/2/index.html');
		let $ = cheerio.load(html);
		assert.equal($('h1').text(), 'Page 2');
	});

	// for regression: https://github.com/withastro/astro/issues/11990
	it('nested static paths generate', async () => {
		let html = await fixture.readFile('/get-static-paths-pages/archive/news/july-2024/2/index.html');
		let $ = cheerio.load(html);
		assert.equal($('#slug').text(), 'news');
		assert.equal($('#page').text(), 'july-2024/2');
	});
});
