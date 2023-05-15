import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Component parallelization', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/parallel/',
		});
		await fixture.build();
	});

	it('renders fast', async () => {
		let html = await fixture.readFile('/index.html');
		let $ = cheerio.load(html);

		const startTimes = Array.from($('.start')).map((element) => Number(element.children[0].data));
		const finishTimes = Array.from($('.finished')).map((element) =>
			Number(element.children[0].data)
		);

		let renderStartWithin = Math.max(...startTimes) - Math.min(...startTimes);
		expect(renderStartWithin).to.be.lessThan(
			10, // in theory, this should be 0, so 10ms tolerance
			"The components didn't start rendering in parallel"
		);

		const totalRenderTime = Math.max(...finishTimes) - Math.min(...startTimes);
		expect(totalRenderTime).to.be.lessThan(
			60, // max component delay is 40ms
			'The total render time was significantly longer than the max component delay'
		);
	});
});
