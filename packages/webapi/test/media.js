import { assert, test } from '../run/test.setup.js'
import { polyfill } from '../mod.js'

test(() => {
	return [
		{
			name: 'Includes MediaQueryList functionality',
			test() {
				const target = {}
	
				polyfill(target)
	
				assert.equal(Reflect.has(target, 'MediaQueryList'), true)
				assert.equal(Reflect.has(target, 'matchMedia'), true)
			},
		},
		{
			name: 'Supports matchMedia creation',
			test() {
				const target = {}
	
				polyfill(target)

				const mql = target.matchMedia('(min-width: 640px)')

				assert.equal(mql.matches, false)
				assert.equal(mql.media, '(min-width: 640px)')
			},
		},
	]
})
