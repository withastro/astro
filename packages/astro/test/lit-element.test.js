import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('LitElement test', function () {
	this.timeout(30000);

	let fixture;

	const NODE_VERSION = parseFloat(process.versions.node);
	const stripExpressionMarkers = (html) => html.replace(/<!--\/?lit-part-->/g, '');

	before(async () => {
		// @lit-labs/ssr/ requires Node 13.9 or higher
		if (NODE_VERSION < 13.9) {
			return;
		}
		fixture = await loadFixture({
			projectRoot: './fixtures/lit-element/',
		});
		await fixture.build();
	});

	it('Renders a custom element by tag name', async () => {
		// @lit-labs/ssr/ requires Node 13.9 or higher
		if (NODE_VERSION < 13.9) {
			return;
		}
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		// test 1: attributes rendered – non reactive properties
		expect($('my-element').attr('foo')).to.equal('bar');

		// test 2: shadow rendered
		expect($('my-element').html()).to.include(`<div>Testing...</div>`);

		// test 3: string reactive property set
		expect(stripExpressionMarkers($('my-element').html())).to.include(`<div id="str">initialized</div>`);

		// test 4: boolean reactive property correctly set
		// <my-element bool="false"> Lit will equate to true because it uses
		// this.hasAttribute to determine its value
		expect(stripExpressionMarkers($('my-element').html())).to.include(`<div id="bool">B</div>`);

		// test 5: object reactive property set
		// by default objects will be stringifed to [object Object]
		expect(stripExpressionMarkers($('my-element').html())).to.include(`<div id="data">data: 1</div>`);

		// test 6: reactive properties are not rendered as attributes
		expect($('my-element').attr('obj')).to.equal(undefined);
		expect($('my-element').attr('bool')).to.equal(undefined);
		expect($('my-element').attr('str')).to.equal(undefined);

		// test 7: reflected reactive props are rendered as attributes
		expect($('my-element').attr('reflectedbool')).to.equal('');
		expect($('my-element').attr('reflected-str')).to.equal('default reflected string');
		expect($('my-element').attr('reflected-str-prop')).to.equal('initialized reflected');
	});

	// Skipped because not supported by Lit
	it.skip('Renders a custom element by the constructor', async () => {
		const html = await fixture.fetch('/ctr/index.html');
		const $ = cheerio.load(html);

		// test 1: attributes rendered
		expect($('my-element').attr('foo')).to.equal('bar');

		// test 2: shadow rendered
		expect($('my-element').html()).to.include(`<div>Testing...</div>`);
	});
});
