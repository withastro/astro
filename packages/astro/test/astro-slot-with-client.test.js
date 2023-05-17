import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Slots with client: directives', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-slot-with-client/' });
		await fixture.build();
	});

	it('Tags of dynamic tags works', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('script')).to.have.a.lengthOf(1);
	});

	it('Astro slot tags are cleaned', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		expect($('astro-slot')).to.have.a.lengthOf(0);
	});
});
