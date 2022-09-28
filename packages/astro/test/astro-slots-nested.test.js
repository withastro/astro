import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Nested Slots', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-slots-nested/' });
		await fixture.build();
	});

	it('Hidden nested slots see their hydration scripts hoisted', async () => {
		const html = await fixture.readFile('/hidden-nested/index.html');
		const $ = cheerio.load(html);
		expect($('script')).to.have.a.lengthOf(1, 'script rendered');
		const scriptInTemplate = $($('template')[0].children[0]).find('script');
		expect(scriptInTemplate).to.have.a.lengthOf(0, 'script defined outside of the inner template');
	});
});
