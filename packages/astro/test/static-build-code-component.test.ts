import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { fixture } from './preludes/standard-static.prelude.ts';

describe('Code component inside static build', () => {
	it('Is able to build successfully', async () => {
		const html = await fixture.readFile('/static-code/index.html');
		const $ = cheerio.load(html);
		assert.equal($('pre').length, 1, 'pre tag loaded');
	});
});
