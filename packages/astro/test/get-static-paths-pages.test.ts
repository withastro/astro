import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('getStaticPaths with trailingSlash: ignore', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/get-static-paths-pages/',
			site: 'https://mysite.dev/',
			outDir: './dist/get-static-paths-pages/',
		});
		await fixture.build();
	});

	it('includes index page', async () => {
		let html = await fixture.readFile('/index.html');
		let $ = cheerio.load(html);
		assert.equal($('h1').text(), 'Page 1');
	});

	it('includes paginated page', async () => {
		let html = await fixture.readFile('/2/index.html');
		let $ = cheerio.load(html);
		assert.equal($('h1').text(), 'Page 2');
	});

	// for regression: https://github.com/withastro/astro/issues/11990
	it('nested static paths generate', async () => {
		let html = await fixture.readFile('/archive/news/july-2024/2/index.html');
		let $ = cheerio.load(html);
		assert.equal($('#slug').text(), 'news');
		assert.equal($('#page').text(), 'july-2024/2');
	});
});
