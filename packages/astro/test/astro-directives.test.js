import { expect } from 'chai';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Directives', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-directives/' });
		await fixture.build();
	});

	it('Passes define:vars to script elements', async () => {
		const html = await fixture.readFile('/define-vars/index.html');
		const $ = cheerio.load(html);

		expect($('script')).to.have.lengthOf(3);

		let i = 0;
		for (const script of $('script').toArray()) {
			// Wrap script in scope ({}) to avoid redeclaration errors
			expect($(script).text().at(0)).to.equal('{');
			expect($(script).text().at(-1)).to.equal('}');
			if (i < 2) {
				// Inline defined variables
				expect($(script).toString()).to.include('let foo = "bar"');
			} else {
				// Convert invalid keys to valid identifiers
				expect($(script).toString()).to.include('let dashCase = "bar"');
			}
			i++;
		}
	});

	it('Passes define:vars to style elements', async () => {
		const html = await fixture.readFile('/define-vars/index.html');
		const $ = cheerio.load(html);

		expect($('style')).to.have.lengthOf(2);

		// Inject style attribute on top-level element in page
		expect($('html').attr('style').toString()).to.include('--bg: white;');
		expect($('html').attr('style').toString()).to.include('--fg: black;');

		// Inject style attribute on top-level elements in component
		expect($('h1').attr('style').toString()).to.include('--textColor: red;');
	});

	it('set:html', async () => {
		const html = await fixture.readFile('/set-html/index.html');
		const $ = cheerio.load(html);

		expect($('#text')).to.have.lengthOf(1);
		expect($('#text').text()).to.equal('a');

		expect($('#zero')).to.have.lengthOf(1);
		expect($('#zero').text()).to.equal('0');

		expect($('#number')).to.have.lengthOf(1);
		expect($('#number').text()).to.equal('1');

		expect($('#undefined')).to.have.lengthOf(1);
		expect($('#undefined').text()).to.equal('');

		expect($('#null')).to.have.lengthOf(1);
		expect($('#null').text()).to.equal('');

		expect($('#false')).to.have.lengthOf(1);
		expect($('#false').text()).to.equal('');

		expect($('#true')).to.have.lengthOf(1);
		expect($('#true').text()).to.equal('true');
	});
});
