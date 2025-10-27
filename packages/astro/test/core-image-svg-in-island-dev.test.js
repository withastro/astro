import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('astro:assets - SVG Components in Astro Islands', () => {
	describe('dev', () => {
		/** @type {import('./test-utils.js').Fixture} */
		let fixture;
		/** @type {import('./test-utils.js').DevServer} */
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-svg-in-island/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Server APIs are not imported to the dev server', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html, { xml: true });
			const island = $('astro-island');
			const componentUrl = island.attr('component-url');
			assert.ok(componentUrl, 'Expected component-url attribute to be present on astro-island.');
			const componentModule = await fixture.fetch(componentUrl).then((res) => res.text());
			const imports = componentModule
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => line.startsWith('import '));
			const svgImportStatement = imports.find((imp) => imp.includes('src/components/astro.svg'));
			assert.ok(svgImportStatement, 'Expected SVG to be imported in the component.');
			const importPath = svgImportStatement.split('from')[1].trim().replace(/['";]/g, '');
			const mod = await fixture.fetch(importPath).then((res) => res.text());
			assert.ok(
				mod.length < 1_500,
				`Expected SVG module to be smaller than 1500 bytes, got ${mod.length} bytes. If this test fails, it is likely that server code has been imported while importing an SVG.`,
			);
			assert.ok(
				!mod.includes('import'),
				'Expected client-side SVG not to include import statements.',
			);
		});
	});
});
