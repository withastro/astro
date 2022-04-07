import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Expressions', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-expr/',
		});
		await fixture.build();
	});

	it('Can load page', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		for (let col of ['red', 'yellow', 'blue']) {
			expect($('#' + col)).to.have.lengthOf(1);
		}
	});

	it('Ignores characters inside of strings', async () => {
		const html = await fixture.readFile('/strings/index.html');
		const $ = cheerio.load(html);

		for (let col of ['red', 'yellow', 'blue']) {
			expect($('#' + col)).to.have.lengthOf(1);
		}
	});

	it('Ignores characters inside of line comments', async () => {
		const html = await fixture.readFile('/line-comments/index.html');
		const $ = cheerio.load(html);

		for (let col of ['red', 'yellow', 'blue']) {
			expect($('#' + col)).to.have.lengthOf(1);
		}
	});

	it('Ignores characters inside of multiline comments', async () => {
		const html = await fixture.readFile('/multiline-comments/index.html');
		const $ = cheerio.load(html);

		for (let col of ['red', 'yellow', 'blue']) {
			expect($('#' + col)).to.have.lengthOf(1);
		}
	});

	it('Allows multiple JSX children in mustache', async () => {
		const html = await fixture.readFile('/multiple-children/index.html');

		expect(html).to.include('#f');
		expect(html).not.to.include('#t');
	});

	it('Allows <> Fragments in expressions', async () => {
		const html = await fixture.readFile('/multiple-children/index.html');
		const $ = cheerio.load(html);

		expect($('#fragment').children()).to.have.lengthOf(3);
		expect($('#fragment').children('#a')).to.have.lengthOf(1);
		expect($('#fragment').children('#b')).to.have.lengthOf(1);
		expect($('#fragment').children('#c')).to.have.lengthOf(1);
	});

	it('Does not render falsy values using &&', async () => {
		const html = await fixture.readFile('/falsy/index.html');
		const $ = cheerio.load(html);

		// test 1: Expected {true && <span id="true" />} to render
		expect($('#true')).to.have.lengthOf(1);

		// test 2: Expected {0 && "VALUE"} to render "0"
		expect($('#zero').text()).to.equal('0');

		// test 3: Expected {false && <span id="false" />} not to render
		expect($('#false')).to.have.lengthOf(0);

		// test 4: Expected {null && <span id="null" />} not to render
		expect($('#null')).to.have.lengthOf(0);

		// test 5: Expected {undefined && <span id="undefined" />} not to render
		expect($('#undefined')).to.have.lengthOf(0);

		// Inside of a component

		// test 6: Expected {true && <span id="true" />} to render
		expect($('#frag-true')).to.have.lengthOf(1);

		// test 7: Expected {false && <span id="false" />} not to render
		expect($('#frag-false')).to.have.lengthOf(0);

		// test 8: Expected {null && <span id="null" />} not to render
		expect($('#frag-null')).to.have.lengthOf(0);

		// test 9: Expected {undefined && <span id="undefined" />} not to render
		expect($('#frag-undefined')).to.have.lengthOf(0);
	});

	it('Escapes HTML by default', async () => {
		const html = await fixture.readFile('/escape/index.html');
		const $ = cheerio.load(html);

		expect($('body').children()).to.have.lengthOf(2);
		expect($('body').html()).to.include('&lt;script&gt;console.log("pwnd")&lt;/script&gt;');
		expect($('#trusted')).to.have.lengthOf(1);
	});

	it('Does not double-escape HTML', async () => {
		const html = await fixture.readFile('/escape/index.html');
		const $ = cheerio.load(html);

		expect($('#single-escape').html()).to.equal('Astro &amp; Vite');
	});
});
