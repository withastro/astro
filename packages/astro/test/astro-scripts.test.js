import { expect } from 'chai';
import cheerio from 'cheerio';
import path from 'path';
import { loadFixture } from './test-utils.js';

describe('Scripts (hoisted and not)', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ projectRoot: './fixtures/astro-scripts/' });
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

		// test 1: Just one entry module
		expect($('script')).to.have.lengthOf(1);

		// test 2: attr removed
		expect($('script').attr('data-astro')).to.equal(undefined);

		let entryURL = path.join('inline', $('script').attr('src'));
		let inlineEntryJS = await fixture.readFile(entryURL);

		// test 3: the JS exists
		expect(inlineEntryJS).to.be.ok;
	});

	it('External page builds the hoisted scripts to a single bundle', async () => {
		let external = await fixture.readFile('/external/index.html');
		let $ = cheerio.load(external);

		// test 1: there are two scripts
		expect($('script')).to.have.lengthOf(2);

		let el = $('script').get(1);
		let entryURL = path.join('external', $(el).attr('src'));
		let externalEntryJS = await fixture.readFile(entryURL);

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
