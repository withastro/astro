import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import { describe } from 'node:test';

describe('Html Escape Bug', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/html-escape-bug/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		it('work', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			const h1 = $('h1');
			const script = $('script');

			expect(h1.text()).to.equal('Astro');
			expect(script.text()).to.equal(
				[
					'\n\t\tconst count = 6;',
					'const normal = `There are ${count} things!`;',
					'const content = `There are `${count}` things!`;',
					`document.getElementById('normal').innerText = normal;`,
					`document.getElementById('content').innerText = content;`,
				].join('\n\t\t') + '\n\t'
			);
		});
	});
});
