import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture, type Fixture } from './test-utils.ts';

// https://github.com/withastro/astro/issues/18123
describe('CSS deduplication for client:only components', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/css-client-only-dedup/',
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build();
	});

	it('does not duplicate component CSS when used both statically and with client:only on the same page', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		const cssLinks = $('link[rel="stylesheet"]');
		const allCssContents: string[] = [];
		for (let i = 0; i < cssLinks.length; i++) {
			const href = cssLinks.eq(i).attr('href')!;
			const content = await fixture.readFile(href.replace(/^\//, '/'));
			allCssContents.push(content);
		}

		// Count how many linked stylesheets contain the card CSS marker
		const sheetsWithMarker = allCssContents.filter((css) =>
			css.includes('--card-css-marker'),
		);
		assert.equal(
			sheetsWithMarker.length,
			1,
			`Expected the card CSS marker to appear in exactly 1 linked stylesheet, but found it in ${sheetsWithMarker.length}. Component CSS should not be duplicated when the component is used both statically and with client:only.`,
		);
	});

	it('still includes CSS for client:only components used alone on a page', async () => {
		const html = await fixture.readFile('/only/index.html');
		const $ = cheerio.load(html);

		let allCss = '';
		const cssLinks = $('link[rel="stylesheet"]');
		for (let i = 0; i < cssLinks.length; i++) {
			const href = cssLinks.eq(i).attr('href')!;
			allCss += await fixture.readFile(href.replace(/^\//, '/'));
		}
		$('style').each((_, el) => {
			allCss += $(el).html();
		});

		assert.ok(
			allCss.includes('--card-css-marker'),
			'A page using the component only with client:only should still receive its CSS',
		);
	});
});
