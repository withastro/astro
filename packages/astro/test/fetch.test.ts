import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { fixture } from './preludes/standard-static.prelude.ts';

describe('Global Fetch', () => {
	it('Is available in Astro pages', async () => {
		const html = await fixture.readFile('/fetch-test/index.html');
		const $ = cheerio.load(html);
		assert.equal($('#astro-page').text(), 'function', 'Fetch supported in .astro page');
	});
	it('Is available in Astro components', async () => {
		const html = await fixture.readFile('/fetch-test/index.html');
		const $ = cheerio.load(html);
		assert.equal($('#astro-component').text(), 'function', 'Fetch supported in .astro components');
	});
	it('Is available in non-Astro components', async () => {
		const html = await fixture.readFile('/fetch-test/index.html');
		const $ = cheerio.load(html);
		assert.equal($('#jsx').text(), 'function', 'Fetch supported in .jsx');
		assert.equal($('#svelte').text(), 'function', 'Fetch supported in .svelte');
		assert.equal($('#vue').text(), 'function', 'Fetch supported in .vue');
	});
	it('Respects existing code', async () => {
		const html = await fixture.readFile('/fetch-test/index.html');
		const $ = cheerio.load(html);
		assert.equal($('#already-imported').text(), 'function', 'Existing fetch imports respected');
		assert.equal($('#custom-declaration').text(), 'number', 'Custom fetch declarations respected');
	});
});
