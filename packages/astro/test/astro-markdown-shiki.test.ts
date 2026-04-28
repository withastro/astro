import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Astro Markdown Shiki', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-markdown-shiki/langs/' });
		await fixture.build();
	});

	describe('Render shiki', () => {
		it('Can render markdown with shiki', async () => {
			const html = await fixture.readFile('/normal/index.html');
			const $ = cheerio.load(html);

			// There should be no HTML from Prism
			assert.equal($('.token').length, 0);

			assert.equal($('pre').length, 2);
			assert.ok($('pre').hasClass('astro-code'));
			assert.equal(
				$('pre').attr()!.style,
				'background-color:#24292e;color:#e1e4e8; overflow-x: auto;',
			);
		});
	});

	describe('Languages', () => {
		let $: cheerio.CheerioAPI;

		before(async () => {
			const html = await fixture.readFile('/index.html');
			$ = cheerio.load(html);
		});

		it('custom language', async () => {
			const lang = $('.astro-code').get(0);
			const segments = $('.line', lang).get(6)!.children as any[];
			assert.equal(segments.length, 2);
			assert.equal(segments[0].attribs.style, 'color:#79B8FF');
			assert.equal(segments[1].attribs.style, 'color:#E1E4E8');
		});

		it('handles unknown languages', () => {
			const unknownLang = $('.astro-code').get(1)!;
			assert.ok(unknownLang.attribs.style.includes('background-color:#24292e;color:#e1e4e8;'));
		});
	});
});
