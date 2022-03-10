import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Directives', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ projectRoot: './fixtures/astro-directives/' });
		await fixture.build();
	});

	it('Passes define:vars to script elements', async () => {
		const html = await fixture.readFile('/define-vars/index.html');
		const $ = cheerio.load(html);

		expect($('script#inline')).to.have.lengthOf(1);
		expect($('script#inline').toString()).to.include('let foo = "bar"');
	});
});
