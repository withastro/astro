import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('View Transitions styles', () => {
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/view-transitions/' });
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('style tag added for each instance of the component', async () => {
		let res = await fixture.fetch('/multiple');
		let html = await res.text();
		let $ = cheerio.load(html);

		expect($('head style')).to.have.a.lengthOf(3);
	});
});
