import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Scripts (hoisted and not)', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-scripts/',
			vite: {
				build: {
					assetsInlineLimit: 0,
				},
			},
		});
		await fixture.build();
	});

	it('Moves external scripts up', async () => {
		const html = await fixture.readFile('/external/index.html');
		const $ = cheerio.load(html);

		expect($('head script[type="module"]:not([src="/regular_script.js"])')).to.have.lengthOf(1);
		expect($('body script')).to.have.lengthOf(0);
	});

	it('Moves inline scripts up', async () => {
		const html = await fixture.readFile('/inline/index.html');
		const $ = cheerio.load(html);

		expect($('head script[type="module"]')).to.have.lengthOf(1);
		expect($('body script')).to.have.lengthOf(0);
	});

	it('Inline page builds the scripts to a single bundle', async () => {
		// Inline page
		let inline = await fixture.readFile('/inline/index.html');
		let $ = cheerio.load(inline);
		let $el = $('script');

		// test 1: Just one entry module
		expect($el).to.have.lengthOf(1);

		// test 2: attr removed
		expect($el.attr('data-astro')).to.equal(undefined);

		expect($el.attr('src')).to.equal(undefined);
		const inlineEntryJS = $el.text();

		// test 3: the JS exists
		expect(inlineEntryJS).to.be.ok;

		// test 4: Inline imported JS is included
		expect(inlineEntryJS).to.contain(
			'I AM IMPORTED INLINE',
			'The inline imported JS is included in the bundle'
		);
	});

	it('Inline scripts that are shared by multiple pages create chunks, and aren\'t inlined into the HTML', async () => {
		let html = await fixture.readFile('/inline-shared-one/index.html');
		let $ = cheerio.load(html);

		expect($('script')).to.have.lengthOf(1);
		expect($('script').attr('src')).to.not.equal(undefined);
	});

	it('External page builds the hoisted scripts to a single bundle', async () => {
		let external = await fixture.readFile('/external/index.html');
		let $ = cheerio.load(external);

		// test 1: there are two scripts
		expect($('script')).to.have.lengthOf(2);

		let el = $('script').get(1);
		expect($(el).attr('src')).to.equal(undefined, 'This should have been inlined');
		let externalEntryJS = $(el).text();

		// test 2: the JS exists
		expect(externalEntryJS).to.be.ok;
	});

	it('External page using non-hoist scripts that are modules are built standalone', async () => {
		let external = await fixture.readFile('/external-no-hoist/index.html');
		let $ = cheerio.load(external);

		// test 1: there is 1 scripts
		expect($('script')).to.have.lengthOf(1);

		// test 2: inside assets
		let entryURL = $('script').attr('src');
		expect(entryURL.includes('assets/')).to.equal(true);
	});

	it('External page using non-hoist scripts that are not modules are built standalone', async () => {
		let external = await fixture.readFile('/external-no-hoist-classic/index.html');
		let $ = cheerio.load(external);

		// test 1: there is 1 scripts
		expect($('script')).to.have.lengthOf(1);

		// test 2: inside assets
		let entryURL = $('script').attr('src');
		expect(entryURL.includes('assets/')).to.equal(true);
	});
});
