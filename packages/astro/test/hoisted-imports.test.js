import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import * as cheerio from 'cheerio';

describe('Hoisted Imports', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/hoisted-imports/',
		});
	});

	async function getPageBundleText(page) {
		const html = await fixture.readFile(page);
		const $ = cheerio.load(html);
		// Scripts
		const scriptText = [];

		const importRegex = /import\s*?['"]([^'"]+?)['"]/g;
		async function resolveImports(text) {
			const matches = text.matchAll(importRegex);
			for (const match of matches) {
				const importPath = match[1];
				const importText = await fixture.readFile('/_astro/' + importPath);
				scriptText.push(await resolveImports(importText));
			}
			return text;
		}

		const scripts = $('script');
		for (let i = 0; i < scripts.length; i++) {
			const src = scripts.eq(i).attr('src');

			let text;
			if (src) {
				text = await fixture.readFile(src);
			} else {
				text = scripts.eq(i).text();
			}
			scriptText.push(await resolveImports(text));
		}

		// Styles
		const styleText = [];

		const styleLinks = $('link[rel="stylesheet"]');
		for (let i = 0; i < styleLinks.length; i++) {
			const href = styleLinks.eq(i).attr('href');
			styleText.push(await fixture.readFile(href));
		}
		const styleBlocks = $('link[rel="stylesheet"]');
		for (let i = 0; i < styleBlocks.length; i++) {
			const text = styleBlocks.eq(i).text();
			styleText.push(text);
		}

		return [scriptText.join('\n'), styleText.join('\n')];
	}

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		function expectComponent([scripts, styles], letter) {
			const regex = new RegExp(`console.log\\(['"]${letter}['"]\\)`);
			expect(scripts, 'missing component script ' + letter).to.match(regex);
			const styleRegex = new RegExp(`\\.${letter}`);
			expect(styles, 'missing component style ' + letter).to.match(styleRegex);
		}
		function expectNotComponent([scripts, styles], letter) {
			const regex = new RegExp(`console.log\\(['"]${letter}['"]\\)`);
			expect(scripts, "shouldn't include component script " + letter).to.not.match(regex);
			const styleRegex = new RegExp(`\\.${letter}`);
			expect(styles, "shouldn't include component style " + letter).to.not.match(styleRegex);
		}

		it('includes all imported scripts', async () => {
			const bundle = await getPageBundleText('/all/index.html');
			expectComponent(bundle, 'A');
			expectComponent(bundle, 'B');
			expectComponent(bundle, 'C');
			expectComponent(bundle, 'D');
			expectComponent(bundle, 'E');
		});
		it('includes all imported scripts when dynamically imported', async () => {
			const bundle = await getPageBundleText('/dynamic/index.html');
			expectComponent(bundle, 'A');
			expectComponent(bundle, 'B');
			expectComponent(bundle, 'C');
			expectComponent(bundle, 'D');
			expectComponent(bundle, 'E');
		});
		it('includes no scripts when none imported', async () => {
			const bundle = await getPageBundleText('/none/index.html');
			expectNotComponent(bundle, 'A');
			expectNotComponent(bundle, 'B');
			expectNotComponent(bundle, 'C');
			expectNotComponent(bundle, 'D');
			expectNotComponent(bundle, 'E');
		});
		it('includes some scripts', async () => {
			const bundle = await getPageBundleText('/some/index.html');
			expectComponent(bundle, 'A');
			expectNotComponent(bundle, 'B');
			expectComponent(bundle, 'C');
			expectNotComponent(bundle, 'D');
			expectNotComponent(bundle, 'E');
		});
	});
});
