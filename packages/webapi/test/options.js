import { assert, test } from '../run/test.setup.js'
import { polyfill } from '../mod.js'

test(() => {
	return [
		{
			name: 'Can exclude HTMLElement+',
			test() {
				const target = {}
	
				polyfill(target, {
					exclude: 'HTMLElement+'
				})
	
				assert.equal(Reflect.has(target, 'Event'), true)
				assert.equal(Reflect.has(target, 'EventTarget'), true)
				assert.equal(Reflect.has(target, 'Element'), true)
				assert.equal(Reflect.has(target, 'HTMLElement'), false)
				assert.equal(Reflect.has(target, 'HTMLDivElement'), false)
			},
		},
		{
			name: 'Can exclude Event+',
			test() {
				const target = {}
	
				polyfill(target, {
					exclude: 'Event+'
				})
	
				assert.equal(Reflect.has(target, 'Event'), false)
				assert.equal(Reflect.has(target, 'EventTarget'), false)
				assert.equal(Reflect.has(target, 'Element'), false)
				assert.equal(Reflect.has(target, 'HTMLElement'), false)
				assert.equal(Reflect.has(target, 'HTMLDivElement'), false)
			},
		},
		{
			name: 'Can exclude document',
			test() {
				const target = {}
	
				polyfill(target, {
					exclude: 'document'
				})
	
				assert.equal(Reflect.has(target, 'Document'), true)
				assert.equal(Reflect.has(target, 'HTMLDocument'), true)
				assert.equal(Reflect.has(target, 'document'), false)
			},
		},
	]
})
