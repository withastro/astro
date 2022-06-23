import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('JSX', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/jsx/'
		});
		await fixture.build();
	});

	it('Can load simple JSX components', async () => {
		const html = await fixture.readFile('/component/index.html');
		const $ = cheerio.load(html);

		expect($('#basic').text()).to.equal('Basic');
		expect($('#named').text()).to.equal('Named');
	});
});
