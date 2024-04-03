import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('getStaticPaths', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/get-static-paths-pages/',
			site: 'https://mysite.dev/',
		});
		await fixture.build();
	});

	describe('pagination', () => {
		it('includes index page', async () => {
			let html = await fixture.readFile('/pages/index.html');
			let $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Page 1');
		});
	
		it('includes paginated page', async () => {
			let html = await fixture.readFile('/pages/2/index.html');
			let $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Page 2');
		});
	});

	describe('pathToParam', () => {
		it('no slash the param is left alone', async () => {
			let html = await fixture.readFile('/paths/one/index.html');
			let $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Path: one');
		});

		it('starts with slash the slash is removed', async () => {
			let html = await fixture.readFile('/paths/two/index.html');
			let $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Path: two');
		});

		it('ends with slash the slash is removed', async () => {
			let html = await fixture.readFile('/paths/three/index.html');
			let $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Path: three');
		});

		it('starts with and ends with slash, slash is removed', async () => {
			let html = await fixture.readFile('/paths/four/index.html');
			let $ = cheerio.load(html);
			assert.equal($('h1').text(), 'Path: four');
		});
	});
});
