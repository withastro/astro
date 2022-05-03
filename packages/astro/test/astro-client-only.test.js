import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Client only components', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-client-only/',
		});
		await fixture.build();
	});

	it('Loads pages using client:only hydrator', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);

		// test 1: <astro-island> is empty
		expect($('astro-island').html()).to.equal('');
		const $script = $('script');
		const script = $script.html();

		// Has the renderer URL for svelte
		expect($('astro-island').attr('renderer-url').length).to.be.greaterThan(0);
	});

	it('Adds the CSS to the page', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);
		expect($('link[rel=stylesheet]')).to.have.lengthOf(2);
	});
});
