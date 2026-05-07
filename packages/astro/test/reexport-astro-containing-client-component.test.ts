import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { fixture } from './preludes/standard-static.prelude.ts';

describe('Re-exported astro components with client components', () => {
	it('Is able to build and renders and stuff', async () => {
		const html = await fixture.readFile('/reexport-client/index.html');
		const $ = cheerio.load(html);
		assert.equal($('astro-island').length, 1);
		assert.equal($('astro-island').attr('component-export'), 'One');
	});
});
