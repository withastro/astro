import assert from 'node:assert/strict';
import { describe, before, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Hydration script ordering', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/hydration-race' });
		await fixture.build();
	});

	it('Places the hydration script before the first island', async () => {
		let html = await fixture.readFile('/index.html');
		let $ = cheerio.load(html);

		// First, let's make sure all islands rendered (or test is bad)
		assert.strictEqual($('astro-island').length, 3);

		// Now let's make sure the hydration script is placed before the first component
		let firstIsland = $($('astro-island').get(0));
		let prevSibling = firstIsland.prev();
		assert.strictEqual(prevSibling.prop('tagName'), 'SCRIPT');

		// Sanity check that we're only rendering them once.
		assert.strictEqual($('style').length, 1, 'hydration style added once');
		assert.strictEqual($('script').length, 1, 'only one hydration script needed');
	});
});
