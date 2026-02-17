// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import {
	createComponent,
	render,
	renderComponent,
	spreadAttributes,
	addAttribute,
} from '../../../dist/runtime/server/index.js';
import * as cheerio from 'cheerio';
import { createManifest, createRouteInfo } from './test-helpers.js';

const attributesRouteData = {
	route: '/attributes',
	component: 'src/pages/attributes.astro',
	params: [],
	pathname: '/attributes',
	distURL: [],
	pattern: /^\/attributes\/?$/,
	segments: [[{ content: 'attributes', dynamic: false, spread: false }]],
	type: 'page',
	prerender: false,
	fallbackRoutes: [],
	isIndex: false,
	origin: 'project',
};

const attributesNamespacedRouteData = {
	route: '/namespaced',
	component: 'src/pages/namespaced.astro',
	params: [],
	pathname: '/namespaced',
	distURL: [],
	pattern: /^\/namespaced\/?$/,
	segments: [[{ content: 'namespaced', dynamic: false, spread: false }]],
	type: 'page',
	prerender: false,
	fallbackRoutes: [],
	isIndex: false,
	origin: 'project',
};

const attributesNamespacedComponentRouteData = {
	route: '/namespaced-component',
	component: 'src/pages/namespaced-component.astro',
	params: [],
	pathname: '/namespaced-component',
	distURL: [],
	pattern: /^\/namespaced-component\/?$/,
	segments: [[{ content: 'namespaced-component', dynamic: false, spread: false }]],
	type: 'page',
	prerender: false,
	fallbackRoutes: [],
	isIndex: false,
	origin: 'project',
};

const attributesPage = createComponent(() => {
	return render`
    <a id="download-true" href="file.pdf" ${addAttribute(true, 'download')} />
    <a id="download-false" href="file.pdf" ${addAttribute(false, 'download')} />
    <a id="download-undefined" href="file.pdf" ${addAttribute(undefined, 'download')} />
    <a id="download-string-empty" href="file.pdf" ${addAttribute('', 'download')}  />
    <a id="download-string" href="file.pdf" ${addAttribute('my-document.pdf', 'download')} />

    <dialog id="popover-auto" ${addAttribute('auto', 'popover')} />
    <dialog id="popover-true" ${addAttribute(true, 'popover')} />
    <dialog id="popover-false" ${addAttribute(false, 'popover')} />
    <dialog id="popover-string-empty" ${addAttribute('', 'popover')} />

    <div id="hidden-until-found" ${addAttribute('until-found', 'hidden')} />
    <div id="hidden-true" ${addAttribute(true, 'hidden')} />
    <div id="hidden-false" ${addAttribute(false, 'hidden')} />
    <div id="hidden-string-empty" ${addAttribute('', 'hidden')} />

    <span id="boolean-attr-true" ${addAttribute(true, 'allowfullscreen')} />
    <span id="boolean-attr-false" ${addAttribute(false, 'allowfullscreen')} />
    <span id="boolean-attr-string-truthy" ${addAttribute('foo', 'allowfullscreen')} />
    <span id="boolean-attr-string-falsy" ${addAttribute('', 'allowfullscreen')} />
    <span id="boolean-attr-number-truthy" ${addAttribute(1, 'allowfullscreen')} />
    <span id="boolean-attr-number-falsy" ${addAttribute(0, 'allowfullscreen')} />

    <span id="data-attr-true" ${addAttribute(true, 'data-foobar')} />
    <span id="data-attr-false" ${addAttribute(false, 'data-foobar')} />
    <span id="data-attr-string-truthy" ${addAttribute('foo', 'data-foobar')} />
    <span id="data-attr-string-falsy" ${addAttribute('', 'data-foobar')} />
    <span id="data-attr-number-truthy" ${addAttribute(1, 'data-foobar')} />
    <span id="data-attr-number-falsy" ${addAttribute(0, 'data-foobar')} />

    <span id="normal-attr-true" ${addAttribute(true, 'foobar')} />
    <span id="normal-attr-false" ${addAttribute(false, 'foobar')} />
    <span id="normal-attr-string-truthy" ${addAttribute('foo', 'foobar')} />
    <span id="normal-attr-string-falsy" ${addAttribute('', 'foobar')} />
    <span id="normal-attr-number-truthy" ${addAttribute(1, 'foobar')} />
    <span id="normal-attr-number-falsy" ${addAttribute(0, 'foobar')} />

    <span id="null" ${addAttribute(null, 'attr')} />
    <span id="undefined" ${addAttribute(undefined, 'attr')} />

    <span id="url" ${addAttribute('https://example.com/api/og?title=hello&description=somedescription', 'attr')}/>
    <span id="code" ${addAttribute('cmd: echo "foo" && echo "bar" > /tmp/hello.txt', 'attr')} />

    <!--
        Other attributes should be treated as string enums
        These should always render <span draggable="true" /> or <span draggable="false" />
    -->
    <span id='html-enum' draggable='true' />
    <span id='html-enum-true'${addAttribute(true, 'draggable')} />
    <span id='html-enum-false'${addAttribute(false, 'draggable')} />
  `;
});

const attributesNamespacedPage = createComponent(() => {
	return render`
    <div xmlns:happy="https://example.com/schemas/happy">
    	<img src="jolly.avif" happy:smile="sweet"/>
    </div>
  `;
});

const namespacedSpanComponent = createComponent((result, props, slots) => {
	const Astro = result.createAstro(props, slots);

	return render`
    <span ${spreadAttributes(Astro.props)} />
  `;
});

const attributesNamespacedComponentPage = createComponent((result) => {
	return render`${renderComponent(result, 'NamespacedSpan', namespacedSpanComponent, {
		// biome-ignore lint/suspicious/noConsole: allowed
		'on:click': /** @type {(e: unknown) => void} */ (event) => console.log(event),
	})}`;
});

const pageMap = new Map([
	[
		attributesRouteData.component,
		async () => ({
			page: async () => ({
				default: attributesPage,
			}),
		}),
	],
	[
		attributesNamespacedRouteData.component,
		async () => ({
			page: async () => ({
				default: attributesNamespacedPage,
			}),
		}),
	],
	[
		attributesNamespacedComponentRouteData.component,
		async () => ({
			page: async () => ({
				default: attributesNamespacedComponentPage,
			}),
		}),
	],
]);

const app = new App(
	createManifest({
		// @ts-expect-error routes prop is not yet type-defined
		routes: [
			createRouteInfo(attributesRouteData),
			createRouteInfo(attributesNamespacedRouteData),
			createRouteInfo(attributesNamespacedComponentRouteData),
		],
		pageMap,
	}),
);

describe('Attributes', async () => {
	it('Passes attributes to elements as expected', async () => {
		const request = new Request('http://example.com/attributes');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);

		/**
		 * @typedef {Object} TestAttribute
		 * @property {string} attribute
		 * @property {string | undefined} value
		 */

		/** @type {Record<string, TestAttribute>} */
		const attrs = {
			'download-true': { attribute: 'download', value: '' },
			'download-false': { attribute: 'download', value: undefined },
			'download-undefined': { attribute: 'download', value: undefined },
			'download-string-empty': { attribute: 'download', value: '' },
			'download-string': { attribute: 'download', value: 'my-document.pdf' },
			'popover-auto': { attribute: 'popover', value: 'auto' },
			'popover-true': { attribute: 'popover', value: '' },
			'popover-false': { attribute: 'popover', value: undefined },
			'popover-string-empty': { attribute: 'popover', value: '' },
			// Note: cheerio normalizes boolean `hidden` to the string "hidden",
			// so we use "hidden" as the expected value instead of ""
			'hidden-true': { attribute: 'hidden', value: 'hidden' },
			'hidden-false': { attribute: 'hidden', value: undefined },
			'hidden-string-empty': { attribute: 'hidden', value: 'hidden' },
			'boolean-attr-true': { attribute: 'allowfullscreen', value: '' },
			'boolean-attr-false': { attribute: 'allowfullscreen', value: undefined },
			'boolean-attr-string-truthy': { attribute: 'allowfullscreen', value: '' },
			'boolean-attr-string-falsy': { attribute: 'allowfullscreen', value: undefined },
			'boolean-attr-number-truthy': { attribute: 'allowfullscreen', value: '' },
			'boolean-attr-number-falsy': { attribute: 'allowfullscreen', value: undefined },
			'data-attr-true': { attribute: 'data-foobar', value: 'true' },
			'data-attr-false': { attribute: 'data-foobar', value: 'false' },
			'data-attr-string-truthy': { attribute: 'data-foobar', value: 'foo' },
			'data-attr-string-falsy': { attribute: 'data-foobar', value: '' },
			'data-attr-number-truthy': { attribute: 'data-foobar', value: '1' },
			'data-attr-number-falsy': { attribute: 'data-foobar', value: '0' },
			'normal-attr-true': { attribute: 'foobar', value: 'true' },
			'normal-attr-false': { attribute: 'foobar', value: 'false' },
			'normal-attr-string-truthy': { attribute: 'foobar', value: 'foo' },
			'normal-attr-string-falsy': { attribute: 'foobar', value: '' },
			'normal-attr-number-truthy': { attribute: 'foobar', value: '1' },
			'normal-attr-number-falsy': { attribute: 'foobar', value: '0' },
			null: { attribute: 'attr', value: undefined },
			undefined: { attribute: 'attr', value: undefined },
			'html-enum': { attribute: 'draggable', value: 'true' },
			'html-enum-true': { attribute: 'draggable', value: 'true' },
			'html-enum-false': { attribute: 'draggable', value: 'false' },
		};

		// cheerio normalizes hidden="until-found" to just hidden, so we check the raw HTML
		assert.ok(
			html.includes('id="hidden-until-found" hidden="until-found"'),
			'hidden="until-found" should preserve the attribute value',
		);
		assert.ok(!html.includes('allowfullscreen='), 'boolean attributes should not have values');
		assert.ok(
			!/id="data-attr-string-falsy"\s+data-foobar=/.test(html),
			"data attributes should not have values if it's an empty string",
		);
		assert.ok(
			!/id="normal-attr-string-falsy"\s+data-foobar=/.test(html),
			"normal attributes should not have values if it's an empty string",
		);

		// cheerio will unescape the values, so checking that the url rendered unescaped to begin with has to be done manually
		assert.equal(
			html.includes('https://example.com/api/og?title=hello&description=somedescription'),
			true,
		);

		// cheerio will unescape the values, so checking that the url rendered unescaped to begin with has to be done manually
		assert.equal(
			html.includes('cmd: echo &#34;foo&#34; &#38;&#38; echo &#34;bar&#34; > /tmp/hello.txt'),
			true,
		);

		for (const id of Object.keys(attrs)) {
			const { attribute, value } = attrs[id];
			const attr = $(`#${id}`).attr(attribute);
			assert.equal(attr, value, `Expected ${attribute} to be ${value} for #${id}`);
		}
	});

	it('Passes namespaced attributes as expected', async () => {
		const request = new Request('http://example.com/namespaced');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);

		assert.equal($('div').attr('xmlns:happy'), 'https://example.com/schemas/happy');
		assert.equal($('img').attr('happy:smile'), 'sweet');
	});

	it('Passes namespaced attributes to components as expected', async () => {
		const request = new Request('http://example.com/namespaced-component');
		const response = await app.render(request);
		const html = await response.text();
		const $ = cheerio.load(html);

		assert.deepEqual($('span').attr('on:click'), '(event) => console.log(event)');
	});
});
