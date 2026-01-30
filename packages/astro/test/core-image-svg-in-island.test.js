import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('astro:assets - SVG Components in Astro Islands', async () => {
	/** @type {import('./test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/core-image-svg-in-island/',
		});
	});

	describe('dev', () => {
		/** @type {import('./test-utils.js').DevServer} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(() => devServer.stop());

		it('SVG metadata imported in React island is small', async () => {
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

	describe('build', () => {
		before(() => fixture.build({}));

		after(() => fixture.clean());

		it('React bundle size is small when importing an SVG', async () => {
			const files = await fixture.readdir('_astro');
			const bundledReactComponentFilename = files.find(
				(f) => f.startsWith('ReactTest.') && f.endsWith('.js'),
			);
			assert.ok(bundledReactComponentFilename, 'Expected to find React component in build output.');
			const bundledReactComponent = await fixture.readFile(
				`_astro/${bundledReactComponentFilename}`,
			);
			assert.ok(bundledReactComponent, 'Expected React component bundle not to be empty');
			assert.ok(
				bundledReactComponent.length < 1_000,
				`Expected React component bundle to be smaller than 1000 bytes, got ${bundledReactComponent.length} bytes. If this test fails, it is likely that server code has been imported while importing an SVG.`,
			);
		});
	});
});
