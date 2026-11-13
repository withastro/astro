/**
 * Tests that CSS target lowering works when `vite.build.minify` is `false`.
 *
 * Regression test for https://github.com/withastro/astro/issues/17225
 */

import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture, type Fixture } from './test-utils.ts';

let fixture: Fixture;

describe('CSS target lowering with minify: false', function () {
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/config-vite-css-target-no-minify/',
			outDir: './dist/config-vite-css-target-no-minify/',
		});
	});

	describe('build', () => {
		let html: string;
		let $: cheerio.CheerioAPI;
		let bundledCSS: string;

		before(async () => {
			await fixture.build();
			html = await fixture.readFile('/index.html');
			$ = cheerio.load(html);
			const bundledCSSHREF = $('link[rel=stylesheet][href^=/_astro/]').attr('href')!;
			bundledCSS = await fixture.readFile(bundledCSSHREF.replace(/^\/?/, '/'));
		});

		it('CSS is not minified (multi-line)', () => {
			// Unminified CSS has newlines
			assert.ok(bundledCSS.includes('\n'), 'CSS should contain newlines (not minified)');
		});

		it('imported CSS with width >= syntax is lowered to min-width for safari15', () => {
			// global.css contains `@media screen and (width >= 1000px)` which should be
			// lowered to `min-width: 1000px` for safari15 target
			assert.ok(
				!bundledCSS.includes('width >= 1000px'),
				'CSS should not contain "width >= 1000px" (should be lowered to min-width)',
			);
			assert.ok(
				bundledCSS.includes('min-width: 1000px'),
				'CSS should contain "min-width: 1000px" (lowered from width >= for safari15)',
			);
		});

		it('inline .astro styles are target-lowered', () => {
			// The inline style has `@media screen and (width >= 1111px)` which should
			// be lowered to `min-width: 1111px` for safari15
			assert.ok(
				!bundledCSS.includes('width >= 1111px'),
				'CSS should not contain "width >= 1111px" (should be lowered)',
			);
			assert.ok(
				bundledCSS.includes('min-width: 1111px'),
				'CSS should contain "min-width: 1111px" (lowered from width >= for safari15)',
			);
		});

		it('inline .astro styles with min-width are preserved', () => {
			// The inline style has `@media screen and (min-width: 555px)` which should
			// stay as-is (already compatible with safari15). The compiler may modernize
			// it to `width >= 555px`, but target lowering should reverse that.
			assert.ok(
				bundledCSS.includes('min-width: 555px'),
				'CSS should contain "min-width: 555px" (preserved or lowered back)',
			);
		});
	});
});
