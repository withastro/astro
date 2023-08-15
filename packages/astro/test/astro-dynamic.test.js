import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture, getIslandDataFromScript } from './test-utils.js';

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
		expect($('script').length).to.eq(3);
	});

	it('Loads pages using client:media hydrator', async () => {
		const html = await fixture.readFile('/media/index.html');
		const $ = cheerio.load(html);

		// test 1: static value rendered
		expect($('script').length).to.equal(3);
	});

	it('Loads pages using client:only hydrator', async () => {
		const html = await fixture.readFile('/client-only/index.html');
		const $ = cheerio.load(html);
		const script = $('astro-island > script').first();
		const data = getIslandDataFromScript(script.text());

		// test 1: <astro-island> is empty.
		expect($('astro-island').first().children().length).to.equal(1);
		// test 2: component url
		expect(data.componentUrl).to.include(`/PersistentCounter`);
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
		expect($('script').length).to.eq(3);
	});

	it('Loads pages using client:media hydrator', async () => {
		const html = await fixture.readFile('/media/index.html');
		const $ = cheerio.load(html);

		// test 1: static value rendered
		expect($('script').length).to.equal(3);
	});

	it('Loads pages using client:only hydrator', async () => {
		const html = await fixture.readFile('/client-only/index.html');
		const $ = cheerio.load(html);
		const script = $('astro-island > script').first();
		const data = getIslandDataFromScript(script.text());

		// test 1: <astro-island> is empty.
		expect($('astro-island').first().children().length).to.equal(1);
		// test 2: component url
		expect(data.componentUrl).to.include(`blog/_astro/PersistentCounter`);
	});
});
