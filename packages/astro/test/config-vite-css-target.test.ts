/**
 * css-target
 */

import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture, type Fixture } from './test-utils.ts';

let fixture: Fixture;

describe('CSS', function () {
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/config-vite-css-target/',
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
			outDir: './dist/config-vite-css-target/',
		});
	});

	describe('build', () => {
		let $: cheerio.CheerioAPI;
		let html: string;
		let bundledCSS: string;

		before(async () => {
			await fixture.build();

			// get bundled CSS (will be hashed, hence DOM query)
			html = await fixture.readFile('/index.html');
			$ = cheerio.load(html);
			const bundledCSSHREF = $('link[rel=stylesheet][href^=/_astro/]').attr('href')!;
			bundledCSS = (await fixture.readFile(bundledCSSHREF.replace(/^\/?/, '/')))
				.replace(/\s/g, '')
				.replace('/n', '');
		});

		it('vite.build.cssTarget is respected', async () => {
			assert.match(bundledCSS, /\.class\[data-astro-[^{]*\{top:0;right:0;bottom:0;left:0\}/);
		});
	});
});
