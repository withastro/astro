import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.ts';

describe('Symlink CSS', () => {
	let realHtml: string;
	let linkedHtml: string;

	before(
		async () => {
			// Build from real directory
			const realFixture = await loadFixture({
				root: './fixtures/symlink-css/',
			});
			await realFixture.build();
			realHtml = await realFixture.readFile('/index.html');

			// Build from symlinked directory
			const linkedFixture = await loadFixture({
				root: './fixtures/symlink-css-linked/',
			});
			await linkedFixture.build();
			linkedHtml = await linkedFixture.readFile('/index.html');
		},
		{ timeout: 60000 },
	);

	it('should include CSS when building from a symlinked directory', () => {
		const $linked = cheerio.load(linkedHtml);
		const cssLinks = $linked('link[rel=stylesheet]').length;
		const styles = $linked('style').length;
		assert.ok(cssLinks > 0 || styles > 0, 'Should have CSS in symlinked build');
	});

	it('should have same CSS output as real directory build', () => {
		const $real = cheerio.load(realHtml);
		const $linked = cheerio.load(linkedHtml);
		const realCssCount = $real('link[rel=stylesheet]').length + $real('style').length;
		const linkedCssCount = $linked('link[rel=stylesheet]').length + $linked('style').length;
		assert.equal(linkedCssCount, realCssCount, 'Should have same number of CSS references');
	});
});
