import { assert, test } from '../run/test.setup.js'
import { polyfill } from '../mod.js'

test(() => {
	return [
		{
			name: 'Fetch functionality',
			test() {
				const target = {}

				polyfill(target)

				assert.equal(Reflect.has(target, 'fetch'), true)
				assert.equal(typeof target.fetch, 'function')
			},
		},
		{
			name: 'Fetch with https',
			async test() {
				const target = {}

				polyfill(target)

				const { fetch } = target

				const response = await fetch('https://api.openbrewerydb.org/breweries')

				assert.equal(response.constructor, target.Response)

				const json = await response.json()

				assert.equal(Array.isArray(json), true)
			},
		},
		{
			name: 'Fetch with file',
			async test() {
				const target = {}

				polyfill(target)

				const { fetch } = target

				const url = new URL('../package.json', import.meta.url)

				const response = await fetch(url)

				assert.equal(response.constructor, target.Response)

				assert.equal(response.status, 200)
				assert.equal(response.statusText, '')
				assert.equal(response.headers.has('date'), true)
				assert.equal(response.headers.has('content-length'), true)
				assert.equal(response.headers.has('last-modified'), true)

				const json = await response.json()

				assert.equal(json.name, '@astrojs/webapi')
			},
		},
		{
			name: 'Fetch with missing file',
			async test() {
				const target = {}

				polyfill(target)

				const { fetch } = target

				const url = new URL('../missing.json', import.meta.url)

				const response = await fetch(url)

				assert.equal(response.constructor, target.Response)

				assert.equal(response.status, 404)
				assert.equal(response.statusText, '')
				assert.equal(response.headers.has('date'), true)
				assert.equal(response.headers.has('content-length'), false)
				assert.equal(response.headers.has('last-modified'), false)
			},
		},
		{
			name: 'Fetch with (file) Request',
			async test() {
				const target = {}

				polyfill(target)

				const { Request, fetch } = target

				const request = new Request(new URL('../package.json', import.meta.url))

				const response = await fetch(request)

				assert.equal(response.constructor, target.Response)

				const json = await response.json()

				assert.equal(json.name, '@astrojs/webapi')
			},
		},
		{
			name: 'Fetch with relative file',
			async test() {
				const target = {}

				polyfill(target)

				const { fetch } = target

				const response = await fetch('package.json')

				const json = await response.json()

				assert.equal(json.name, '@astrojs/webapi')
			},
		},
		{
			name: 'Fetch with data',
			async test() {
				const target = {}

				polyfill(target)

				const { fetch } = target

				const jsonURI = `data:application/json,${encodeURIComponent(
					JSON.stringify({
						name: '@astrojs/webapi',
					})
				)}`

				const response = await fetch(jsonURI)

				const json = await response.json()

				assert.equal(json.name, '@astrojs/webapi')
			},
		},
	]
})
