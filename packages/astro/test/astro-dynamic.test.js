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

		// test 1: <astro-root> is empty.
		expect($('<astro-root>').html()).to.equal('');
		// test 2: correct script is being loaded.
		// because of bundling, we don't have access to the source import,
		// only the bundled import.
		expect($('script').html()).to.include(`import setup from '../entry`);
	});
});
