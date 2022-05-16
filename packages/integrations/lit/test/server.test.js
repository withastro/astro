import { expect } from 'chai';
import server from '../server.js'
import { LitElement, html } from 'lit'
import * as cheerio from 'cheerio'

const { check, renderToStaticMarkup } = server

describe('check', () => {
	it('should be false with no component', async () => {
		expect(await check()).to.equal(false)
	})

	it('should be false with a registered non-lit component', async () => {
		const tagName = 'non-lit-component'
		customElements.define(tagName, class TestComponent extends HTMLElement {})
		expect(await check(tagName)).to.equal(false)
	})

	it('should be true with a registered lit component', async () => {
		const tagName = 'lit-component'
		customElements.define(tagName, class extends LitElement {})
		expect(await check(tagName)).to.equal(true)
	})
})

describe('renderToStaticMarkup', () => {
	it('should throw error if trying to render an unregistered component', async () => {
		const tagName = 'non-registrered-component'
		try {
			await renderToStaticMarkup(tagName)
		} catch (e) {
			expect(e).to.be.an.instanceOf(TypeError)
		}
	})

	it('should render emtpy component with default markup', async () => {
		const tagName = 'nothing-component'
		customElements.define(tagName, class extends LitElement {})
		const render = await renderToStaticMarkup(tagName)
		expect(render).to.deep.equal({
			html: `<${tagName}><template shadowroot="open"><!--lit-part--><!--/lit-part--></template></${tagName}>`
		})
	})

	it('should render component with default markup', async () => {
		const tagName = 'simple-component'
		customElements.define(tagName, class extends LitElement {
			render() {
				return html`<p>hola</p>`
			}
		})
		const render = await renderToStaticMarkup(tagName)
		const $ = cheerio.load(render.html)
		expect($(`${tagName} template`).html()).to.contain('<p>hola</p>')
	})

	it('should render component with properties and attributes', async () => {
		const tagName = 'props-and-attrs-component'
		const attr1 = 'test'
		const prop1 = 'Daniel'
		customElements.define(tagName, class extends LitElement {
			static properties = {
				prop1: { type: String },
			}

			constructor() {
				super();
				this.prop1 = 'someone';
			}
		
			render() {
				return html`<p>Hello ${this.prop1}</p>`
			}
		})
		const render = await renderToStaticMarkup(tagName, { prop1, attr1 })
		const $ = cheerio.load(render.html)
		expect($(tagName).attr('attr1')).to.equal(attr1)
		expect($(`${tagName} template`).text()).to.contain(`Hello ${prop1}`)
	})
})
