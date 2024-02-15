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

	async function getAllScriptText(page) {
		const html = await fixture.readFile(page);
		const $ = cheerio.load(html);
		return $('script')
			.map((_, el) => $(el).text())
			.toArray()
			.join('\n');
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

		it('inlines if script is larger than vite.assetInlineLimit: 100', async () => {
			const html = await fixture.readFile('/no-inline/index.html');
			const $ = cheerio.load(html);
			const scripts = $('script');
			expect(scripts.length).to.equal(1);
			// have src attr
			expect(scripts[0].attribs.src).to.be.ok;
		});
	});
});
