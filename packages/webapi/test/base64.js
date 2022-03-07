import { assert, test } from '../run/test.setup.js'
import { polyfill } from '../mod.js'

test(() => {
	return [
		{
			name: 'Supports Base64 Methods',
			test() {
				const target = {}
	
				polyfill(target)
	
				assert.equal('atob' in target, true)
				assert.equal('btoa' in target, true)
				assert.equal(typeof target['atob'], 'function')
				assert.equal(typeof target['btoa'], 'function')
			},
		},
		{
			name: 'Supports atob(data)',
			test() {
				const target = {}
	
				polyfill(target)

				const a = 'SGVsbG8sIHdvcmxk'
				const b = target.atob(a)

				assert.equal(a, 'SGVsbG8sIHdvcmxk')
				assert.equal(b, 'Hello, world')
			},
		},
		{
			name: 'Supports btoa(data)',
			test() {
				const target = {}
	
				polyfill(target)

				const b = 'Hello, world'
				const a = target.btoa(b)

				assert.equal(a, 'SGVsbG8sIHdvcmxk')
				assert.equal(b, 'Hello, world')
			},
		},
	]
})
