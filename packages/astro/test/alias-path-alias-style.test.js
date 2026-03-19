import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

// Regression test for https://github.com/withastro/astro/issues/15963
// <style> tags in components imported via tsconfig path aliases should compile correctly.
describe('Style compilation with tsconfig path aliases', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/alias-path-alias-style/',
		});
		await fixture.build();
	});

	it('builds successfully and includes scoped styles from aliased component', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		// The styled component should be rendered
		assert.ok($('.styled').length > 0, 'Styled component should be present in output');

		// Scoped styles should be inlined or linked
		const inlineStyles = $('style').text();
		const hasBlueStyle =
			(inlineStyles.includes('color') && inlineStyles.includes('blue')) ||
			inlineStyles.includes('#00f') ||
			inlineStyles.includes('color:blue') ||
			inlineStyles.includes('color: blue');
		assert.ok(hasBlueStyle, 'Scoped .styled CSS should be present in output');
	});
});
