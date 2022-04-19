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

	it('Fetch with file', async () => {
		const { fetch } = target

		const url = new URL('../package.json', import.meta.url)

		const response = await fetch(url)

		expect(response.constructor).to.equal(target.Response)

		expect(response.status).to.equal(200)
		expect(response.statusText).to.be.empty
		expect(response.headers.has('date')).to.equal(true)
		expect(response.headers.has('content-length')).to.equal(true)
		expect(response.headers.has('last-modified')).to.equal(true)

		const json = await response.json()

		expect(json.name).to.equal('@astrojs/webapi')
	})

	it('Fetch with missing file', async () => {
		const { fetch } = target

		const url = new URL('../missing.json', import.meta.url)

		const response = await fetch(url)

		expect(response.constructor).to.equal(target.Response)

		expect(response.status).to.equal(404)
		expect(response.statusText).to.be.empty
		expect(response.headers.has('date')).to.equal(true)
		expect(response.headers.has('content-length')).to.equal(false)
		expect(response.headers.has('last-modified')).to.equal(false)
	})

	it('Fetch with (file) Request', async () => {
		const { Request, fetch } = target

		const request = new Request(new URL('../package.json', import.meta.url))

		const response = await fetch(request)

		expect(response.constructor).to.equal(target.Response)

		const json = await response.json()

		expect(json.name).to.equal('@astrojs/webapi')
	})

	it('Fetch with relative file', async () => {
		const { fetch } = target

		const response = await fetch('package.json')

		const json = await response.json()

		expect(json.name).to.equal('@astrojs/webapi')
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
