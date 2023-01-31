import { expect } from 'chai'
import { polyfill } from '../mod.js'

describe('Custom Elements', () => {
	const target = {}

	beforeEach(() => polyfill(target))

	it('Includes Custom Element functionality', () => {
		expect(target).to.have.property('CustomElementRegistry')
		expect(target).to.have.property('customElements')
		expect(target).to.have.property('HTMLElement')
	})

	it('Supports Custom Element creation', () => {
		const CustomElement = class HTMLCustomElement extends target.HTMLElement {}

		target.customElements.define('custom-element', CustomElement)

		expect(target.customElements.get('custom-element')).to.equal(CustomElement)
		expect(target.customElements.getName(CustomElement)).to.equal(
			'custom-element'
		)
	})

	it('Supports Custom Elements created from Document', () => {
		expect(target.document.body.localName).to.equal('body')
		expect(target.document.body.tagName).to.equal('BODY')

		expect(
			target.document.createElement('custom-element').constructor.name
		).to.equal('HTMLUnknownElement')

		const CustomElement = class HTMLCustomElement extends target.HTMLElement {}

		target.customElements.define('custom-element', CustomElement)

		expect(
			target.document.createElement('custom-element').constructor.name
		).to.equal('HTMLCustomElement')
	})

	it('Supports Custom Elements with properties', () => {
		const testSymbol = Symbol.for('webapi.test')

		const CustomElement = class HTMLCustomElement extends target.HTMLElement {
			otherMethod = () => testSymbol

			method() {
				return this.otherMethod()
			}

			static method() {
				return this.otherMethod()
			}

			static otherMethod() {
				return testSymbol
			}
		}

		target.customElements.define('custom-element', CustomElement)

		expect(CustomElement.method()).to.equal(testSymbol)

		const customElement = new CustomElement()

		expect(customElement.method()).to.equal(testSymbol)
	})
})
