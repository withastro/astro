import { expect } from 'chai'
import { polyfill } from '../mod.js'

describe('structuredClone', () => {
	const target = {}

	before(() => polyfill(target))

	it('Includes structuredClone', () => {
		expect(target).to.have.property('structuredClone').that.is.a('function')
	})

	it('Supports structuredClone usage', () => {
		const obj = {
			foo: 'bar',
			baz: {
				qux: 'quux',
			},
		}

		const clone = target.structuredClone(obj)

		expect(obj).to.not.equal(clone)
		expect(obj.baz).to.not.equal(clone.baz)

		expect(obj.baz.qux).to.equal(clone.baz.qux)
	})
})
