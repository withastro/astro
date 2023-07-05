import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Dynamic components', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-dynamic/',
		});
		await fixture.build();
	});

	it('Loads packages that only run code in client', async () => {
		const html = await fixture.readFile('/index.html');

		const $ = cheerio.load(html);
		expect($('script').length).to.eq(1);
	});

	it('Loads pages using client:media hydrator', async () => {
		const html = await fixture.readFile('/media/index.html');
		const $ = cheerio.load(html);

		// test 1: static value rendered
		expect($('script').length).to.equal(1);
	});

	it('Loads pages using client:only hydrator', async () => {
		const html = await fixture.readFile('/client-only/index.html');
		const $ = cheerio.load(html);

		// test 1: <astro-island> is empty.
		expect($('astro-island').html()).to.equal('');
		// test 2: component url
		const href = $('astro-island').attr('component-url');
		expect(href).to.include(`/PersistentCounter`);
	});
});

describe('Dynamic components subpath', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			site: 'https://site.com',
			base: '/blog',
			root: './fixtures/astro-dynamic/',
		});
		await fixture.build();
	});

	it('Loads packages that only run code in client', async () => {
		const html = await fixture.readFile('/index.html');

		const $ = cheerio.load(html);
		expect($('script').length).to.eq(1);
	});

	it('Loads pages using client:media hydrator', async () => {
		const html = await fixture.readFile('/media/index.html');
		const $ = cheerio.load(html);

		// test 1: static value rendered
		expect($('script').length).to.equal(1);
	});

	it('Loads pages using client:only hydrator', async () => {
		const html = await fixture.readFile('/client-only/index.html');
		const $ = cheerio.load(html);

		// test 1: <astro-island> is empty.
		expect($('astro-island').html()).to.equal('');
		// test 2: has component url
		const attr = $('astro-island').attr('component-url');
		expect(attr).to.include(`blog/_astro/PersistentCounter`);
	});
});
