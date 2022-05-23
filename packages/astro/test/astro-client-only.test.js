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

		// test 1: <astro-root> is empty
		expect($('astro-root').html()).to.equal('');
		const $script = $('script');
		const script = $script.html();

		// test 2: svelte renderer is on the page
		expect(/import\("\/entry.*/g.test(script)).to.be.ok;
	});

	it('Adds the CSS to the page', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);
		expect($('link[rel=stylesheet]')).to.have.lengthOf(2);
	});
});

describe('Client only components subpath', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			site: 'https://site.com',
			base: '/blog',
			root: './fixtures/astro-client-only/',
		});
		await fixture.build();
	});

	it('Loads pages using client:only hydrator', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);

		// test 1: <astro-root> is empty
		expect($('astro-root').html()).to.equal('');
		const $script = $('script');
		const script = $script.html();

		// test 2: svelte renderer is on the page
		expect(/import\("\/blog\/entry.*/g.test(script)).to.be.ok;
	});

	it('Adds the CSS to the page', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);
		expect($('link[rel=stylesheet]')).to.have.lengthOf(2);
	});
});
