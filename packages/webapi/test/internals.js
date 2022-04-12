import { expect } from 'chai'
import { polyfill } from '../mod.js'

it('Includes polyfill.internals functionality', () => {
	const target = {}

	polyfill(target, { exclude: 'window document' })

	const pseudo = { ...target }

	expect(pseudo).to.not.have.property('document')

	const CustomElement = class extends pseudo.HTMLElement {}

	pseudo.customElements.define('custom-element', CustomElement)

	polyfill.internals(pseudo, 'Document')

	expect(pseudo).to.have.property('document')

	expect(
		CustomElement.prototype.isPrototypeOf(
			pseudo.document.createElement('custom-element')
		)
	).to.equal(true)
})
