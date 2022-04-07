import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Pages', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-pages/' });
		await fixture.build();
	});

	it('Can find page with "index" at the end file name', async () => {
		const html = await fixture.readFile('/posts/name-with-index/index.html');
		const $ = cheerio.load(html);

		expect($('h1').text()).to.equal('Name with index');
	});
});
