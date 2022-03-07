import { assert, test } from '../run/test.setup.js'
import { polyfill } from '../mod.js'

test(() => {
	return [
		{
			name: 'Includes Storage functionality',
			test() {
				const target = {}

				polyfill(target)
	
				assert.equal(Reflect.has(target, 'Storage'), true)
				assert.equal(Reflect.has(target, 'localStorage'), true)
				assert.equal(typeof target.Storage, 'function')
				assert.equal(typeof target.localStorage, 'object')
			},
		},
		{
			name: 'Supports Storage methods',
			test() {
				const target = {}

				polyfill(target)

				assert.equal(target.localStorage.setItem('hello', 'world'), undefined)
				assert.equal(target.localStorage.getItem('hello'), 'world')
				assert.equal(target.localStorage.key(0), 'hello')
				assert.equal(target.localStorage.key(1), null)
				assert.equal(target.localStorage.length, 1)
				assert.equal(target.localStorage.setItem('world', 'hello'), undefined)
				assert.equal(target.localStorage.key(1), 'world')
				assert.equal(target.localStorage.key(2), null)
				assert.equal(target.localStorage.length, 2)
				assert.equal(target.localStorage.removeItem('hello'), undefined)
				assert.equal(target.localStorage.key(0), 'world')
				assert.equal(target.localStorage.key(1), null)
				assert.equal(target.localStorage.length, 1)
				assert.equal(target.localStorage.clear(), undefined)
				assert.equal(target.localStorage.key(0), null)
				assert.equal(target.localStorage.length, 0)
			},
		},
	]
})
