import { assert, test } from '../run/test.setup.js'
import { polyfill } from '../mod.js'

test(() => {
	return [
		{
			name: 'Includes structuredClone',
			test() {
				const target = {}

				polyfill(target)

				assert.equal(Reflect.has(target, 'structuredClone'), true)
				assert.equal(typeof target.structuredClone, 'function')
			},
		},
		{
			name: 'Supports structuredClone usage',
			test() {
				const target = {}

				polyfill(target)

				const obj = {
					foo: 'bar',
					baz: {
						qux: 'quux',
					},
				}

				const clone = target.structuredClone(obj)

				assert.notEqual(obj, clone)
				assert.notEqual(obj.baz, clone.baz)

				assert.equal(obj.baz.qux, clone.baz.qux)
			},
		},
	]
})
