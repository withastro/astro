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
		expect($('#default').attr('foo')).to.equal('bar');

		// test 2: shadow rendered
		expect($('#default').html()).to.include(`<div>Testing...</div>`);

		// test 3: string reactive property set
		expect(stripExpressionMarkers($('#default').html())).to.include(
			`<div id="str">initialized</div>`
		);

		// test 4: boolean reactive property correctly set
		// <my-element bool="false"> Lit will equate to true because it uses
		// this.hasAttribute to determine its value
		expect(stripExpressionMarkers($('#default').html())).to.include(`<div id="bool">B</div>`);

		// test 5: object reactive property set
		// by default objects will be stringified to [object Object]
		expect(stripExpressionMarkers($('#default').html())).to.include(`<div id="data">data: 1</div>`);

		// test 6: reactive properties are not rendered as attributes
		expect($('#default').attr('obj')).to.equal(undefined);
		expect($('#default').attr('bool')).to.equal(undefined);
		expect($('#default').attr('str')).to.equal(undefined);

		// test 7: reflected reactive props are rendered as attributes
		expect($('#default').attr('reflectedbool')).to.equal('');
		expect($('#default').attr('reflected-str')).to.equal('default reflected string');
		expect($('#default').attr('reflected-str-prop')).to.equal('initialized reflected');
	});

	it('Sets defer-hydration on element only when necessary', async () => {
		// @lit-labs/ssr/ requires Node 13.9 or higher
		if (NODE_VERSION < 13.9) {
			return;
		}
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);

		// test 1: reflected reactive props are rendered as attributes
		expect($('#non-deferred').attr('count')).to.equal('10');

		// test 2: non-reactive props are set as attributes
		expect($('#non-deferred').attr('foo')).to.equal('bar');

		// test 3: components with only reflected reactive props set are not
		// deferred because their state can be completely serialized via attributes
		expect($('#non-deferred').attr('defer-hydration')).to.equal(undefined);

		// test 4: components with non-reflected reactive props set are deferred because
		// their state needs to be synced with the server on the client.
		expect($('#default').attr('defer-hydration')).to.equal('');
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

		expect($('#default').length).to.equal(3);

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
