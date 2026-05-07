import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { fixture } from './preludes/standard-static.prelude.ts';

describe('Lazily imported layouts', () => {
	it('Renders styles only once', async () => {
		const html = await fixture.readFile('/lazy-layout/index.html');
		const $ = cheerio.load(html);
		assert.equal($('link').length, 1);
	});
});
