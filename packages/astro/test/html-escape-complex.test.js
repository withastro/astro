import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('HTML Escape (Complex)', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/html-escape-complex/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('properly escapes user code', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			const h1 = $('h1');
			const script = $('script');

			expect(h1.text()).to.equal('Astro');
			// Ignore whitespace in text
			const text = script.text().trim().split('\n').map(ln => ln.trim());

			// HANDY FOR DEBUGGING BACKSLASHES:
			// The logged output should exactly match the way <script> is authored in `index.html`
			// console.log(text.join('\n'));

			expect(text).to.deep.equal([
				"const normal = `There are ${count} things!`;",
				"const content = `There are \\`${count}\\` things!`;",
				'const a = "\\`${a}\\`";',
				'const b = "\\\\`${b}\\\\`";',
				'const c = "\\\\\\`${c}\\\\\\`";',
				'const d = "\\\\\\\\`${d}\\\\\\\\`";',
				'const e = "\\\\\\\\\\`${e}\\\\\\\\\\`";',
				'const f = "\\\\\\\\\\\\`${f}\\\\\\\\\\\\`";',
			])
		});
	});
});
