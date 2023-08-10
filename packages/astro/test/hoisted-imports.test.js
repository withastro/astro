import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import * as cheerio from 'cheerio';

describe('Hoisted Imports', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/hoisted-imports/',
			experimental: {
				optimizeHoistedScript: true,
			},
		});
	});

	async function getAllScriptText(page) {
		const html = await fixture.readFile(page);
		const $ = cheerio.load(html);
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
		return scriptText.join('\n');
	}

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		function expectScript(scripts, letter) {
			const regex = new RegExp(`console.log\\(['"]${letter}['"]\\)`);
			expect(scripts, 'missing component ' + letter).to.match(regex);
		}
		function expectNotScript(scripts, letter) {
			const regex = new RegExp(`console.log\\(['"]${letter}['"]\\)`);
			expect(scripts, "shouldn't include component " + letter).to.not.match(regex);
		}

		it('includes all imported scripts', async () => {
			const scripts = await getAllScriptText('/all/index.html');
			expectScript(scripts, 'A');
			expectScript(scripts, 'B');
			expectScript(scripts, 'C');
			expectScript(scripts, 'D');
			expectScript(scripts, 'E');
		});
		it('includes all imported scripts when dynamically imported', async () => {
			const scripts = await getAllScriptText('/dynamic/index.html');
			expectScript(scripts, 'A');
			expectScript(scripts, 'B');
			expectScript(scripts, 'C');
			expectScript(scripts, 'D');
			expectScript(scripts, 'E');
		});
		it('includes no scripts when none imported', async () => {
			const scripts = await getAllScriptText('/none/index.html');
			expectNotScript(scripts, 'A');
			expectNotScript(scripts, 'B');
			expectNotScript(scripts, 'C');
			expectNotScript(scripts, 'D');
			expectNotScript(scripts, 'E');
		});
		it('includes some scripts', async () => {
			const scripts = await getAllScriptText('/some/index.html');
			expectScript(scripts, 'A');
			expectNotScript(scripts, 'B');
			expectScript(scripts, 'C');
			expectNotScript(scripts, 'D');
			expectNotScript(scripts, 'E');
		});
	});
});
