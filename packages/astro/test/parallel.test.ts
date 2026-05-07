import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { fixture } from './preludes/standard-static.prelude.ts';

describe('Component parallelization', () => {
	it('renders fast', async () => {
		let html = await fixture.readFile('/parallel-test/index.html');
		let $ = cheerio.load(html);

		const startTimes = Array.from($('.start')).map((element) => Number($(element).text()));
		const finishTimes = Array.from($('.finished')).map((element) => Number($(element).text()));

		const renderStartWithin = Math.max(...startTimes) - Math.min(...startTimes);
		assert.equal(
			renderStartWithin < 40,
			true, // in theory, this should be 0, but add 40ms tolerance for CI
			"The components didn't start rendering in parallel",
		);

		const totalRenderTime = Math.max(...finishTimes) - Math.min(...startTimes);
		assert.equal(
			totalRenderTime < 80,
			true, // max component delay is 40ms, add 40ms tolerance for CI
			'The total render time was significantly longer than the max component delay',
		);
	});
});
