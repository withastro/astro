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

	it('rendered fast', async () => {
		let html = await fixture.readFile('/index.html');
		let $ = cheerio.load(html);
		console.log('HTML', html);

		let firstStart = Number($('.start').first().text());
		let lastStart = Number($('.start').last().text());
		console.log(lastStart, firstStart, lastStart - firstStart);
		expect(lastStart - firstStart).to.be.lessThan(50);
	});
});
