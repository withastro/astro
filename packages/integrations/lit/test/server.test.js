import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { LitElement, html } from 'lit';
// Must come after lit import because @lit/reactive-element defines
// globalThis.customElements which the server shim expects to be defined.
import server from '../server.js';

const { check, renderToStaticMarkup } = server;

describe('check', () => {
	it('should be false with no component', async () => {
		assert.equal(await check(), false);
	});

	it('should be false with a registered non-lit component', async () => {
		const tagName = 'non-lit-component';
		// Lit no longer shims HTMLElement globally, so we need to do it ourselves.
		if (!globalThis.HTMLElement) {
			globalThis.HTMLElement = class {};
		}
		customElements.define(tagName, class TestComponent extends HTMLElement {});
		assert.equal(await check(tagName), false);
	});

	it('should be true with a registered lit component', async () => {
		const tagName = 'lit-component';
		customElements.define(tagName, class extends LitElement {});
		assert.equal(await check(tagName), true);
	});
});

describe('renderToStaticMarkup', () => {
	it('should throw error if trying to render an unregistered component', async () => {
		const tagName = 'non-registrered-component';
		try {
			await renderToStaticMarkup(tagName);
		} catch (e) {
			assert.equal(e instanceof TypeError, true);
		}
	});

	it('should render empty component with default markup', async () => {
		const tagName = 'nothing-component';
		customElements.define(tagName, class extends LitElement {});
		const render = await renderToStaticMarkup(tagName);
		assert.deepEqual(render, {
			html: `<${tagName}><template shadowroot="open" shadowrootmode="open"><!--lit-part--><!--/lit-part--></template></${tagName}>`,
		});
	});

	it('should render component with default markup', async () => {
		const tagName = 'simple-component';
		customElements.define(
			tagName,
			class extends LitElement {
				render() {
					return html`<p>hola</p>`;
				}
			},
		);
		const render = await renderToStaticMarkup(tagName);
		const $ = cheerio.load(render.html);
		assert.equal($(`${tagName} template`).html().includes('<p>hola</p>'), true);
	});

	it('should render component with properties and attributes', async () => {
		const tagName = 'props-and-attrs-component';
		const attr1 = 'test';
		const prop1 = 'Daniel';
		customElements.define(
			tagName,
			class extends LitElement {
				static properties = {
					prop1: { type: String },
				};

				constructor() {
					super();
					this.prop1 = 'someone';
				}

				render() {
					return html`<p>Hello ${this.prop1}</p>`;
				}
			},
		);
		const render = await renderToStaticMarkup(tagName, { prop1, attr1 });
		const $ = cheerio.load(render.html);
		assert.equal($(tagName).attr('attr1'), attr1);
		assert.equal($(`${tagName} template`).text().includes(`Hello ${prop1}`), true);
	});

	it('should render nested components', async () => {
		const tagName = 'parent-component';
		const childTagName = 'child-component';
		customElements.define(
			childTagName,
			class extends LitElement {
				render() {
					return html`<p>child</p>`;
				}
			},
		);
		customElements.define(
			tagName,
			class extends LitElement {
				render() {
					return html`<child-component></child-component>`;
				}
			},
		);
		const render = await renderToStaticMarkup(tagName);
		const $ = cheerio.load(render.html);
		assert.equal($(`${tagName} template`).text().includes('child'), true);
		// Child component should have `defer-hydration` attribute so it'll only
		// hydrate after the parent hydrates
		assert.equal($(childTagName).attr('defer-hydration'), '');
	});

	it('should render DSD attributes based on shadowRootOptions', async () => {
		const tagName = 'shadow-root-options-component';
		customElements.define(
			tagName,
			class extends LitElement {
				static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
			},
		);
		const render = await renderToStaticMarkup(tagName);
		assert.deepEqual(render, {
			html: `<${tagName}><template shadowroot=\"open\" shadowrootmode=\"open\" shadowrootdelegatesfocus><!--lit-part--><!--/lit-part--></template></${tagName}>`,
		});
	});
});
