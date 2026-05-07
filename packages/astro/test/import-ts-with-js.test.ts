import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { fixture } from './preludes/standard-static.prelude.ts';

describe('Using .js extension on .ts file', () => {
	it('works in .astro files', async () => {
		const html = await fixture.readFile('/import-ts-with-js/index.html');
		const $ = cheerio.load(html);
		assert.equal($('h1').text(), 'bar');
	});
});
