import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe(
	'LitElement test',
	{ timeout: 300000, skip: 'This goes in conflict with ssr-lit test file' },
	() => {
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
			assert.equal($('#default').attr('foo'), 'bar');

			// test 2: shadow rendered
			assert.equal($('#default').html().includes('<div>Testing...</div>'), true);

			// test 3: string reactive property set
			assert.equal(
				stripExpressionMarkers($('#default').html()).includes(`<div id="str">initialized</div>`),
				true,
			);

			// test 4: boolean reactive property correctly set
			// <my-element bool="false"> Lit will equate to true because it uses
			// this.hasAttribute to determine its value
			assert.equal(
				stripExpressionMarkers($('#default').html()).includes(`<div id="bool">B</div>`),
				true,
			);

			// test 5: object reactive property set
			// by default objects will be stringified to [object Object]
			assert.equal(
				stripExpressionMarkers($('#default').html()).includes(`<div id="data">data: 1</div>`),
				true,
			);

			// test 6: reactive properties are not rendered as attributes
			assert.equal($('#default').attr('obj'), undefined);
			assert.equal($('#default').attr('bool'), undefined);
			assert.equal($('#default').attr('str'), undefined);

			// test 7: reflected reactive props are rendered as attributes
			assert.equal($('#default').attr('reflectedbool'), '');
			assert.equal($('#default').attr('reflected-str'), 'default reflected string');
			assert.equal($('#default').attr('reflected-str-prop'), 'initialized reflected');
		});

		it('Sets defer-hydration on element only when necessary', async () => {
			// @lit-labs/ssr/ requires Node 13.9 or higher
			if (NODE_VERSION < 13.9) {
				return;
			}
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// test 1: reflected reactive props are rendered as attributes
			assert.equal($('#non-deferred').attr('count'), '10');

			// test 2: non-reactive props are set as attributes
			assert.equal($('#non-deferred').attr('foo'), 'bar');

			// test 3: components with only reflected reactive props set are not
			// deferred because their state can be completely serialized via attributes
			assert.equal($('#non-deferred').attr('defer-hydration'), undefined);

			// test 4: components with non-reflected reactive props set are deferred because
			// their state needs to be synced with the server on the client.
			assert.equal($('#default').attr('defer-hydration'), '');
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

			assert.equal($('#default').length, 3);

			// Root my-element
			assert.equal($rootMyElement.children('.default').length, 2);
			assert.equal($rootMyElement.children('.default').eq(1).text(), 'my-element default 2');

			assert.equal($rootMyElement.children('[slot="named"]').length, 4);
			assert.equal($rootMyElement.children('[slot="named"]').eq(1).text(), 'my-element named 2');
			assert.equal($rootMyElement.children('[slot="named"]').eq(2).attr('id'), 'list');
			assert.equal($rootMyElement.children('[slot="named"]').eq(3).attr('id'), 'slotted');

			// Slotted my-element first level
			assert.equal($slottedMyElement.children('.default').length, 1);
			assert.equal(
				$slottedMyElement.children('.default').eq(0).text(),
				'slotted my-element default',
			);

			assert.equal($slottedMyElement.children('[slot="named"]').length, 3);
			assert.equal(
				$slottedMyElement.children('[slot="named"]').eq(1).text(),
				'slotted my-element named 2',
			);
			assert.equal(
				$slottedMyElement.children('[slot="named"]').eq(2).attr('id'),
				'slotted-slotted',
			);

			// Slotted my-element second level
			assert.equal($slottedSlottedMyElement.children('.default').length, 2);
			assert.equal(
				$slottedSlottedMyElement.children('.default').eq(1).text(),
				'slotted slotted my-element default 2',
			);

			assert.equal($slottedSlottedMyElement.children('[slot="named"]').length, 2);
			assert.equal(
				$slottedSlottedMyElement.children('[slot="named"]').eq(1).text(),
				'slotted slotted my-element named 2',
			);
		});

		it('Is able to build when behind getStaticPaths', async () => {
			const dynamicPage = await fixture.readFile('/1/index.html');
			assert.equal(dynamicPage.length > 0, true);
		});
	},
);
