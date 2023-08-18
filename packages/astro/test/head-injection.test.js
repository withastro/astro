import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Head injection', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/head-injection/',
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		describe('Markdown', () => {
			it('only injects head content once', async () => {
				const html = await fixture.readFile(`/index.html`);
				const $ = cheerio.load(html);

				expect($('head link[rel=stylesheet]')).to.have.a.lengthOf(1);
			});
		});

		describe('Astro components', () => {
			it('Using slots within slots', async () => {
				const html = await fixture.readFile('/with-slot-in-slot/index.html');
				const $ = cheerio.load(html);

				expect($('head link[rel=stylesheet]')).to.have.a.lengthOf(1);
				expect($('body link[rel=stylesheet]')).to.have.a.lengthOf(0);
			});

			it('Using slots with Astro.slots.render()', async () => {
				const html = await fixture.readFile('/with-slot-render/index.html');
				const $ = cheerio.load(html);

				expect($('head link[rel=stylesheet]')).to.have.a.lengthOf(1);
				expect($('body link[rel=stylesheet]')).to.have.a.lengthOf(0);
			});

			it('Using slots within slots using Astro.slots.render()', async () => {
				const html = await fixture.readFile('/with-slot-in-render-slot/index.html');
				const $ = cheerio.load(html);

				expect($('head link[rel=stylesheet]')).to.have.a.lengthOf(2);
				expect($('body link[rel=stylesheet]')).to.have.a.lengthOf(0);
			});

			it('Using slots in Astro.slots.render() inside head buffering', async () => {
				const html = await fixture.readFile('/with-render-slot-in-head-buffer/index.html');
				const $ = cheerio.load(html);

				expect($('head link[rel=stylesheet]')).to.have.a.lengthOf(2);
				expect($('body link[rel=stylesheet]')).to.have.a.lengthOf(0);
			});

			it('Using slots with Astro.slots.render() (layout)', async () => {
				const html = await fixture.readFile('/with-slot-render2/index.html');
				const $ = cheerio.load(html);

				expect($('head link[rel=stylesheet]')).to.have.a.lengthOf(1);
				expect($('body link[rel=stylesheet]')).to.have.a.lengthOf(0);
			});
		});
	});
});
