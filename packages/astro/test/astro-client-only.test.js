import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Client only components', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/astro-client-only/',
		});
		await fixture.build();
	});

	it('Loads pages using client:only hydrator', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		// test 1: <astro-root> is empty
		expect($('astro-root').html()).to.equal('');
		const $script = $('script');
		const script = $script.html();

		// test 2: svelte renderer is on the page
		expect(/import\(".\/PersistentCounter.*/g.test(script)).to.be.ok;
	});
});
