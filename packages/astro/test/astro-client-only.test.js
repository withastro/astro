import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Client only components', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ projectRoot: './fixtures/astro-client-only/' });
		await fixture.build();
	});

	it('Loads pages using client:only hydrator', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		// test 1: <astro-root> is empty
		expect($('astro-root').html()).to.equal('');
		const src = $('script').attr('src');

		const script = await fixture.readFile(src);
		// test 2: svelte renderer is on the page
		const exp = /import\("(.\/client.*)"\)/g;
		let match, svelteRenderer;
		while ((match = exp.exec(script))) {
			svelteRenderer = match[1].replace(/^\./, '/assets/');
		}
		expect(svelteRenderer).to.be.ok;

		// test 3: can load svelte renderer
		const svelteClient = await fixture.readFile(svelteRenderer);
		expect(svelteClient).to.be.ok;
	});
});
