import { expect } from 'chai';
import * as cheerio from 'cheerio';
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
			root: './fixtures/lit-element/',
		});
		await fixture.build();
	});

	it('Renders a custom element by Constructor', async () => {
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
		expect(stripExpressionMarkers($('my-element').html())).to.include(
			`<div id="str">initialized</div>`
		);

		// test 4: boolean reactive property correctly set
		// <my-element bool="false"> Lit will equate to true because it uses
		// this.hasAttribute to determine its value
		expect(stripExpressionMarkers($('my-element').html())).to.include(`<div id="bool">B</div>`);

		// test 5: object reactive property set
		// by default objects will be stringified to [object Object]
		expect(stripExpressionMarkers($('my-element').html())).to.include(
			`<div id="data">data: 1</div>`
		);

		// test 6: reactive properties are not rendered as attributes
		expect($('my-element').attr('obj')).to.equal(undefined);
		expect($('my-element').attr('bool')).to.equal(undefined);
		expect($('my-element').attr('str')).to.equal(undefined);

		// test 7: reflected reactive props are rendered as attributes
		expect($('my-element').attr('reflectedbool')).to.equal('');
		expect($('my-element').attr('reflected-str')).to.equal('default reflected string');
		expect($('my-element').attr('reflected-str-prop')).to.equal('initialized reflected');
	});

	it('Correctly passes child slots', async () => {
		// @lit-labs/ssr/ requires Node 13.9 or higher
		if (NODE_VERSION < 13.9) {
			return;
		}
		const html = await fixture.readFile('/slots/index.html');
		const $ = cheerio.load(html);

		const $rootMyElement = $('#root');
		const $slottedMyElement = $('#slotted');
		const $slottedSlottedMyElement = $('#slotted-slotted');

		expect($('my-element').length).to.equal(3);

		// Root my-element
		expect($rootMyElement.children('.default').length).to.equal(2);
		expect($rootMyElement.children('.default').eq(1).text()).to.equal('my-element default 2');

		expect($rootMyElement.children('[slot="named"]').length).to.equal(4);
		expect($rootMyElement.children('[slot="named"]').eq(1).text()).to.equal('my-element named 2');
		expect($rootMyElement.children('[slot="named"]').eq(2).attr('id')).to.equal('list');
		expect($rootMyElement.children('[slot="named"]').eq(3).attr('id')).to.equal('slotted');

		// Slotted my-element first level
		expect($slottedMyElement.children('.default').length).to.equal(1);
		expect($slottedMyElement.children('.default').eq(0).text()).to.equal(
			'slotted my-element default'
		);

		expect($slottedMyElement.children('[slot="named"]').length).to.equal(3);
		expect($slottedMyElement.children('[slot="named"]').eq(1).text()).to.equal(
			'slotted my-element named 2'
		);
		expect($slottedMyElement.children('[slot="named"]').eq(2).attr('id')).to.equal(
			'slotted-slotted'
		);

		// Slotted my-element second level
		expect($slottedSlottedMyElement.children('.default').length).to.equal(2);
		expect($slottedSlottedMyElement.children('.default').eq(1).text()).to.equal(
			'slotted slotted my-element default 2'
		);

		expect($slottedSlottedMyElement.children('[slot="named"]').length).to.equal(2);
		expect($slottedSlottedMyElement.children('[slot="named"]').eq(1).text()).to.equal(
			'slotted slotted my-element named 2'
		);
	});

	it('Is able to build when behind getStaticPaths', async () => {
		const dynamicPage = await fixture.readFile('/1/index.html');
		expect(dynamicPage.length).to.be.greaterThan(0);
	});
});
