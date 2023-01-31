import { expect } from 'chai'
import { polyfill } from '../mod.js'

describe('Media', () => {
	const target = {}

	before(() => polyfill(target))

	it('Includes MediaQueryList functionality', () => {
		expect(target).to.have.property('MediaQueryList')
		expect(target).to.have.property('matchMedia')
	})

	it('Supports matchMedia creation', () => {
		const mql = target.matchMedia('(min-width: 640px)')

		expect(mql.matches).to.equal(false)
		expect(mql.media).to.equal('(min-width: 640px)')
	})
})
