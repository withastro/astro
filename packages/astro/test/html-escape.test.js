import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('HTML Escape', () => {
	let fixture;
	/** @type {string} */
	let complexInput;
	/** @type {string} */
	let complexOutput;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/html-escape/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
			// For complex HTML test
			complexInput = await fixture.readFile('../src/pages/complex.html');
			complexOutput = await fixture.readFile('./complex/index.html');
		});

		it('escapes template literals in HTML components', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// Verify that template literal characters are properly escaped and rendered
			const div = $('div');
			assert.equal(div.text(), '${foo}');

			const span = $('span');
			assert.equal(span.attr('${attr}'), '');

			const ce = $('custom-element');
			assert.equal(ce.attr('x-data'), '`${test}`');

			const script = $('script');
			assert.equal(script.text(), 'console.log(`hello ${"world"}!`)');
		});

		it('preserves complex escape sequences in HTML pages', async () => {
			// The entire source file should be preserved exactly (minus DOCTYPE)
			assert.equal(complexOutput.replace('<!DOCTYPE html>', ''), complexInput);
		});

		it('respects complex escape sequences in attributes', async () => {
			const $in = cheerio.load(complexInput);
			const $out = cheerio.load(complexOutput);
			for (const char of 'abcdef'.split('')) {
				const attrIn = $in('#' + char).attr('data-attr');
				const attrOut = $out('#' + char).attr('data-attr');
				assert.equal(attrOut, attrIn);
			}
		});

		it('respects complex escape sequences in <script>', async () => {
			const $a = cheerio.load(complexInput);
			const $b = cheerio.load(complexOutput);
			const scriptIn = $a('script');
			const scriptOut = $b('script');

			assert.equal(scriptOut.text(), scriptIn.text());
		});
	});

	describe('dev', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('escapes template literals in HTML components', async () => {
			const res = await fixture.fetch('/');
			assert.equal(res.status, 200);

			const html = await res.text();
			const $ = cheerio.load(html);

			// Verify that template literal characters are properly escaped and rendered
			const div = $('div');
			assert.equal(div.text(), '${foo}');

			const span = $('span');
			assert.equal(span.attr('${attr}'), '');

			const ce = $('custom-element');
			assert.equal(ce.attr('x-data'), '`${test}`');

			const script = $('script');
			assert.equal(script.text(), 'console.log(`hello ${"world"}!`)');
		});
	});
});
