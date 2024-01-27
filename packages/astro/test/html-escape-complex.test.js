import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('HTML Escape (Complex)', () => {
	let fixture;
	/** @type {string} */
	let input;
	/** @type {string} */
	let output;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/html-escape-complex/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
			// readFile operates relative to `dist`
			input = await fixture.readFile('../src/pages/index.html');
			output = await fixture.readFile('./index.html');
		});

		it('respects complex escape sequences in attributes', async () => {
			const $in = cheerio.load(input);
			const $out = cheerio.load(output);
			for (const char of 'abcdef'.split('')) {
				const attrIn = $in('#' + char).attr('data-attr');
				const attrOut = $out('#' + char).attr('data-attr');
				expect(attrOut).to.equal(attrIn);
			}
		});

		it('respects complex escape sequences in <script>', async () => {
			const $a = cheerio.load(input);
			const $b = cheerio.load(output);
			const scriptIn = $a('script');
			const scriptOut = $b('script');

			expect(scriptOut.text()).to.equal(scriptIn.text());
		});

		it('matches the entire source file', async () => {
			// Ignore doctype insertion
			expect(output.replace('<!DOCTYPE html>', '')).to.equal(input);
		});
	});
});
