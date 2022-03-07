import { assert, test } from '../run/test.setup.js'
import { polyfill } from '../mod.js'

test(() => {
	return [
		{
			name: 'Includes polyfill.internals functionality',
			test() {
				const target = {}

				polyfill(target, { exclude: 'window document' })

				const pseudo = { ...target }

				assert.equal(Reflect.has(pseudo, 'document'), false)

				const CustomElement = class extends pseudo.HTMLElement {}

				pseudo.customElements.define('custom-element', CustomElement)

				polyfill.internals(pseudo, 'Document')

				assert.equal(Reflect.has(pseudo, 'document'), true)

				assert.equal(
					CustomElement.prototype.isPrototypeOf(
						pseudo.document.createElement('custom-element')
					),
					true
				)
			},
		},
	]
})
