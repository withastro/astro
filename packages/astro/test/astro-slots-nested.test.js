import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Nested Slots', () => {
	/** @type {import('./test-utils').Fixture} */
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

	it('Slots rendered via Astro.slots.render have the hydration script', async () => {
		const html = await fixture.readFile('/component-slot/index.html');
		const $ = cheerio.load(html);
		expect($('script')).to.have.a.lengthOf(1, 'script rendered');
	});

	describe('Client components nested inside server-only framework components', () => {
		/** @type {cheerio.CheerioAPI} */
		let $;
		before(async () => {
			const html = await fixture.readFile('/server-component-nested/index.html');
			$ = cheerio.load(html);
		});

		it('react', () => {
			expect($('#react astro-slot')).to.have.a.lengthOf(1);
			expect($('#react astro-static-slot')).to.have.a.lengthOf(0);
		});

		it('vue', () => {
			expect($('#vue astro-slot')).to.have.a.lengthOf(1);
			expect($('#vue astro-static-slot')).to.have.a.lengthOf(0);
		});

		it('preact', () => {
			expect($('#preact astro-slot')).to.have.a.lengthOf(1);
			expect($('#preact astro-static-slot')).to.have.a.lengthOf(0);
		});

		it('solid', () => {
			expect($('#solid astro-slot')).to.have.a.lengthOf(1);
			expect($('#solid astro-static-slot')).to.have.a.lengthOf(0);
		});

		it('svelte', () => {
			expect($('#svelte astro-slot')).to.have.a.lengthOf(1);
			expect($('#svelte astro-static-slot')).to.have.a.lengthOf(0);
		});
	});
});
