import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

// Regression test for https://github.com/withastro/astro/issues/17156
// CSS url() references using tsconfig path aliases should resolve correctly.
describe('CSS url() with tsconfig path aliases', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/alias-css-url/',
		});
		await fixture.build();
	});

	it('resolves @assets alias in url() within style tags', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		// Gather all CSS from inline styles and linked stylesheets
		const styleTag = $('style').html() || '';
		const links = $('link[rel=stylesheet]')
			.map((_i, el) => $(el).attr('href'))
			.get();

		let allCss = styleTag;
		if (links.length > 0) {
			const cssContents = await Promise.all(links.map((href) => fixture.readFile(href)));
			allCss += '\n' + cssContents.join('\n');
		}

		// The alias should have been resolved - it should NOT contain @assets
		assert.ok(
			!allCss.includes('@assets/ok.png'),
			'CSS should not contain unresolved @assets alias',
		);
	});
});
