import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { fixture } from './preludes/standard-static.prelude.ts';

// Asset bundling
describe('Page-level styles', () => {
	it("Doesn't add page styles for a page without style imports", async () => {
		let html = await fixture.readFile('/page-level-styles/index.html');
		let $ = await cheerioLoad(html);
		assert.equal($('link').length, 0);
	});

	it('Does add page styles for pages with style imports (or deps)', async () => {
		let html = await fixture.readFile('/page-level-styles/blog/index.html');
		let $ = await cheerioLoad(html);
		assert.equal($('link').length, 1);
	});
});
