import { assert, test } from '../run/test.setup.js'
import { polyfill } from '../mod.js'

test(() => {
	return [
		{
			name: 'Includes URLPattern',
			test() {
				const target = {}

				polyfill(target)

				assert.equal(Reflect.has(target, 'URLPattern'), true)
				assert.equal(typeof target.URLPattern, 'function')
			},
		},
		{
			name: 'Supports URLPattern usage',
			test() {
				const target = {}

				polyfill(target)

				const pattern = new target.URLPattern({ pathname: '/hello/:name' })
				const match = pattern.exec('https://example.com/hello/Deno')

				assert.deepEqual(match.pathname.groups, { name: 'Deno' })
			},
		},
	]
})
