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

		let firstStart = Number($('.start').first().text());
		let lastStart = Number($('.start').last().text());
		let timeTook = lastStart - firstStart;
		expect(timeTook).to.be.lessThan(50, 'the components in the list were kicked off more-or-less at the same time.');
	});
});
