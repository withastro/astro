import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Dynamic components', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/astro-dynamic/',
		});
		await fixture.build();
	});

	it('Loads packages that only run code in client', async () => {
		const html = await fixture.readFile('/index.html');

		const $ = cheerio.load(html);
		expect($('script').length).to.eq(2);
	});

	it('Loads pages using client:media hydrator', async () => {
		const root = new URL('http://example.com/media/index.html');
		const html = await fixture.readFile('/media/index.html');
		const $ = cheerio.load(html);

		// test 1: static value rendered
		expect($('script').length).to.equal(2); // One for each
	});

	it('Loads pages using client:only hydrator', async () => {
		const html = await fixture.readFile('/client-only/index.html');
		const $ = cheerio.load(html);

		// test 1: <astro-root> is empty
		expect($('<astro-root>').html()).to.equal('');
		const script = $('script').text();

		// Grab the svelte import
		// const exp = /import\("(.+?)"\)/g;
		// let match, svelteRenderer;
		// while ((match = exp.exec(result.contents))) {
		//   if (match[1].includes('renderers/renderer-svelte/client.js')) {
		//     svelteRenderer = match[1];
		//   }
		// }

		// test 2: Svelte renderer is on the page
		// expect(svelteRenderer).to.be.ok;

		// test 3: Can load svelte renderer
		// const result = await fixture.fetch(svelteRenderer);
		// expect(result.status).to.equal(200);
	});
});
