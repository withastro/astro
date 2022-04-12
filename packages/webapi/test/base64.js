import { expect } from 'chai'
import { polyfill } from '../mod.js'

describe('Base64', () => {
	const target = {}

	before(() => polyfill(target))

	it('Supports Base64 Methods', () => {
		expect(target).to.have.property('atob').that.is.a('function')
		expect(target).to.have.property('btoa').that.is.a('function')
	})

	it('Supports atob(data)', () => {
		const a = 'SGVsbG8sIHdvcmxk'
		const b = target.atob(a)

		expect(a).to.equal('SGVsbG8sIHdvcmxk')
		expect(b).to.equal('Hello, world')
	})

	it('Supports btoa(data)', () => {
		const b = 'Hello, world'
		const a = target.btoa(b)

		expect(a).to.equal('SGVsbG8sIHdvcmxk')
		expect(b).to.equal('Hello, world')
	})
})
