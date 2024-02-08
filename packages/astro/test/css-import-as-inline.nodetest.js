import assert from 'node:assert/strict';
import { after, describe, before, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Importing raw/inlined CSS', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/css-import-as-inline/',
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
		});
	});
	describe('Build', () => {
		before(async () => {
			await fixture.build();
		});
		it('?inline is imported as a string', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#inline').text().includes('tomato'), true);
			assert.equal($('link[rel=stylesheet]').length, 1);
			assert.equal($('style').length, 0);
		});

		it('?raw is imported as a string', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			assert.equal($('#raw').text().includes('plum'), true);
			assert.equal($('link[rel=stylesheet]').length, 1);
			assert.equal($('style').length, 0);
		});
	});

	describe('Dev', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it("?inline is imported as string and doesn't make css bundled ", async () => {
			const response = await fixture.fetch('/');
			const html = await response.text();
			const $ = cheerio.load(html);

			assert.equal($('#inline').text().includes('tomato'), true);
			assert.equal($('link[rel=stylesheet]').length, 0);
			assert.equal($('style').length, 1);
		});

		it("?raw is imported as a string and doesn't make css bundled", async () => {
			const response = await fixture.fetch('/');
			const html = await response.text();
			const $ = cheerio.load(html);

			assert.equal($('#raw').text().includes('plum'), true);
			assert.equal($('link[rel=stylesheet]').length, 0);
			assert.equal($('style').length, 1);
		});
	});
});
