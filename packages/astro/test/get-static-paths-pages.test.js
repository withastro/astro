import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('getStaticPaths with trailingSlash: ignore', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/get-static-paths-pages/',
			site: 'https://mysite.dev/',
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
});
