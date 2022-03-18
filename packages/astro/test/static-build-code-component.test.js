import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Code component inside static build', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/static-build-code-component/',
		});
		await fixture.build();
	});

	it('Is able to build successfully', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('pre').length, 1, 'pre tag loaded');
	});
});
