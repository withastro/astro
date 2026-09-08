import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

// Regression test for https://github.com/withastro/astro/issues/15963
// <style> tags in components imported via tsconfig path aliases should compile correctly.
describe('Style compilation with tsconfig path aliases', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/alias-path-alias-style/',
			build: { inlineStylesheets: 'never' },
			outDir: './dist/alias-path-alias-style/',
		});
		await fixture.build();
	});

	it('builds successfully and includes scoped styles from aliased component', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		// The styled component should be rendered
		assert.ok($('.styled').length > 0, 'Styled component should be present in output');

		// With inlineStylesheets: 'never', styles are emitted as external CSS files
		const links = $('link[rel=stylesheet]')
			.map((_i, el) => $(el).attr('href'))
			.get();
		assert.ok(links.length > 0, 'Should have at least one linked stylesheet');

		const cssContents = await Promise.all(links.map((href) => fixture.readFile(href)));
		const allCss = cssContents.join('\n');
		assert.ok(
			allCss.includes('.styled'),
			'Scoped .styled CSS should be present in emitted stylesheet',
		);
	});
});
