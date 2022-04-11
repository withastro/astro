import { expect } from 'chai'
import { polyfill } from '../mod.js'

describe('URLPattern', () => {
	const target = {}

	before(() => polyfill(target))

	it('Includes URLPattern', () => {
		expect(target).to.have.property('URLPattern').that.is.a('function')
	})

	it('Supports URLPattern usage', () => {
		const pattern = new target.URLPattern({ pathname: '/hello/:name' })
		const match = pattern.exec('https://example.com/hello/Deno')

		expect(match.pathname.groups).to.deep.equal({ name: 'Deno' })
	})
})
