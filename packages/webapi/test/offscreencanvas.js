import { assert, test } from '../run/test.setup.js'
import { polyfill } from '../mod.js'

test(() => {
	return [
		{
			name: 'Supports OffscreenCanvas',
			test() {
				const target = {}
	
				polyfill(target)
	
				assert.equal('OffscreenCanvas' in target, true)
				assert.equal(typeof target['OffscreenCanvas'], 'function')
			},
		},
		{
			name: 'Supports new (width: number, height: number): OffscreenCanvas',
			test() {
				const target = {}
	
				polyfill(target)

				const w = 640
				const h = 480

				const canvas = new target.OffscreenCanvas(w, h)

				assert.equal(canvas.width, w)
				assert.equal(canvas.height, h)
			},
		},
		{
			name: 'Supports OffscreenCanvas#getContext',
			test() {
				const target = {}
	
				polyfill(target)

				const w = 640
				const h = 480

				const canvas = new target.OffscreenCanvas(w, h)

				const context = canvas.getContext('2d')

				assert.equal(context.canvas, canvas)

				const imageData = context.createImageData(w, h)

				assert.equal(imageData.width, w)
				assert.equal(imageData.height, h)
				assert.equal(imageData.data.length, w * h * 4)
			},
		},
	]
})
