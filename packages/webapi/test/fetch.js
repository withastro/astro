import { expect } from 'chai'
import { polyfill } from '../mod.js'

describe('Fetch', () => {
	const target = {}

	before(() => polyfill(target))

	it('Fetch functionality', () => {
		expect(target).to.have.property('fetch').that.is.a('function')
	})

	it('Fetch with https', async () => {
		const { fetch } = target

		const response = await fetch('https://api.openbrewerydb.org/breweries')

		expect(response.constructor).to.equal(target.Response)

		const json = await response.json()

		expect(json).to.be.an('array')
	})

	it('Fetch with data', async () => {
		const { fetch } = target

		const jsonURI = `data:application/json,${encodeURIComponent(
			JSON.stringify({
				name: '@astrojs/webapi',
			})
		)}`

		const response = await fetch(jsonURI)

		const json = await response.json()

		expect(json.name).to.equal('@astrojs/webapi')
	})
})
