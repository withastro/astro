import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Markdown tests', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/markdown/',
		});
	});

	describe('Build', () => {
		before(async () => {
			await fixture.build();
		});

		it('Can load a markdown page with the `.markdown` extension', async () => {
			const html = await fixture.readFile('/dot-markdown-page/index.html');
			const $ = cheerio.load(html);
			assert.strictEqual($('h1').html(), 'Page with alternative .markdown extension');
			assert.strictEqual($('p').html(), 'Hope this loads fine 🤞');
		});

		it('Can load a markdown page with the `.mdwn` extension', async () => {
			const html = await fixture.readFile('/dot-mdwn-page/index.html');
			const $ = cheerio.load(html);
			assert.strictEqual($('h1').html(), 'Page with alternative .mdwn extension');
			assert.strictEqual($('p').html(), 'Hope this loads fine 🤞');
		});

		it('Can load a markdown page with the `.mkdn` extension', async () => {
			const html = await fixture.readFile('/dot-mkdn-page/index.html');
			const $ = cheerio.load(html);
			assert.strictEqual($('h1').html(), 'Page with alternative .mkdn extension');
			assert.strictEqual($('p').html(), 'Hope this loads fine 🤞');
		});

		it('Can load a markdown page with the `.mdown` extension', async () => {
			const html = await fixture.readFile('/dot-mdown-page/index.html');
			const $ = cheerio.load(html);
			assert.strictEqual($('h1').html(), 'Page with alternative .mdown extension');
			assert.strictEqual($('p').html(), 'Hope this loads fine 🤞');
		});

		it('Can load a markdown page with the `.mkd` extension', async () => {
			const html = await fixture.readFile('/dot-mkd-page/index.html');
			const $ = cheerio.load(html);
			assert.strictEqual($('h1').html(), 'Page with alternative .mkd extension');
			assert.strictEqual($('p').html(), 'Hope this loads fine 🤞');
		});

		it('Can load a simple markdown page with Astro', async () => {
			const html = await fixture.readFile('/post/index.html');
			const $ = cheerio.load(html);

			assert.strictEqual($('p').first().text(), 'Hello world!');
			assert.strictEqual($('#first').text(), 'Some content');
			assert.strictEqual($('#interesting-topic').text(), 'Interesting Topic');
		});

		it('Can load a realworld markdown page with Astro', async () => {
			const html = await fixture.readFile('/realworld/index.html');
			const $ = cheerio.load(html);

			assert.strictEqual($('pre').length, 7);
		});

		it('Does not unescape entities', async () => {
			const html = await fixture.readFile('/entities/index.html');
			assert.match(html, /&#x3C;i>This should NOT be italic&#x3C;\/i>/);
		});
	});
});
