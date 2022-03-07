import { assert, test } from '../run/test.setup.js'
import { polyfill } from '../mod.js'

test(() => {
	return [
		{
			name: 'Supports ImageData',
			test() {
				const target = {}

				polyfill(target)

				assert.equal('ImageData' in target, true)
				assert.equal(typeof target['ImageData'], 'function')
			},
		},
		{
			name: 'Supports new (data: Uint8ClampedArray, width: number, height: number): ImageData',
			test() {
				const target = {}

				polyfill(target)

				const w = 640
				const h = 480
				const d = new Uint8ClampedArray(w * h * 4)

				const id = new target.ImageData(d, w, h)

				assert.equal(id.data, d)
				assert.equal(id.width, w)
				assert.equal(id.height, h)
			},
		},
		{
			name: 'Supports new (data: Uint8ClampedArray, width: number): ImageData',
			test() {
				const target = {}

				polyfill(target)

				const w = 640
				const h = 480
				const d = new Uint8ClampedArray(w * h * 4)

				const id = new target.ImageData(d, w)

				assert.equal(id.data, d)
				assert.equal(id.width, w)
				assert.equal(id.height, h)
			},
		},
		{
			name: 'Supports new (width: number, height: number): ImageData',
			test() {
				const target = {}

				polyfill(target)

				const w = 640
				const h = 480

				const id = new target.ImageData(w, h)

				assert.equal(id.data.length, w * h * 4)
				assert.equal(id.width, w)
				assert.equal(id.height, h)
			},
		},
		{
			name: 'Supports Object.keys(new ImageData(640, 480))',
			test() {
				const target = {}

				polyfill(target)

				const keys = Object.keys(new target.ImageData(640, 480))

				assert.equal(keys.length, 1)
				assert.equal(keys[0], 'data')
			},
		},
	]
})
