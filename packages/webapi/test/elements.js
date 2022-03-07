import { assert, test } from '../run/test.setup.js'
import { polyfill } from '../mod.js'

test(() => {
	return [
		{
			name: 'Includes Custom Element functionality',
			test() {
				const target = {}

				polyfill(target)

				assert.equal(Reflect.has(target, 'CustomElementRegistry'), true)
				assert.equal(Reflect.has(target, 'customElements'), true)
				assert.equal(Reflect.has(target, 'HTMLElement'), true)
			},
		},
		{
			name: 'Supports Custom Element creation',
			test() {
				const target = {}

				polyfill(target)

				const CustomElement = class HTMLCustomElement extends target.HTMLElement {}

				target.customElements.define('custom-element', CustomElement)

				assert.equal(target.customElements.get('custom-element'), CustomElement)
				assert.equal(target.customElements.getName(CustomElement), 'custom-element')
			},
		},
		{
			name: 'Supports Custom Elements created from Document',
			test() {
				const target = {}

				polyfill(target)

				assert.equal(target.document.body.localName, 'body')
				assert.equal(target.document.body.tagName, 'BODY')

				assert.equal(target.document.createElement('custom-element').constructor.name, 'HTMLUnknownElement')

				const CustomElement = class HTMLCustomElement extends target.HTMLElement {}

				target.customElements.define('custom-element', CustomElement)

				assert.equal(target.document.createElement('custom-element').constructor.name, 'HTMLCustomElement')
			},
		},
		{
			name: 'Supports Custom Elements with properties',
			test() {
				const target = {}

				polyfill(target)

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

				assert.equal(CustomElement.method(), testSymbol)

				const customElement = new CustomElement()

				assert.equal(customElement.method(), testSymbol)
			},
		},
	]
})
