import { expect } from 'chai'
import { polyfill } from '../mod.js'

describe('ImageData', () => {
	const target = {}

	before(() => polyfill(target))

	it('Supports ImageData', () => {
		expect(target).to.have.property('ImageData').that.is.a('function')
	})

	it('Supports new (data: Uint8ClampedArray, width: number, height: number): ImageData', () => {
		const w = 640
		const h = 480
		const d = new Uint8ClampedArray(w * h * 4)

		const id = new target.ImageData(d, w, h)

		expect(id.data).to.equal(d)
		expect(id.width).to.equal(w)
		expect(id.height).to.equal(h)
	})

	it('Supports new (data: Uint8ClampedArray, width: number): ImageData', () => {
		const w = 640
		const h = 480
		const d = new Uint8ClampedArray(w * h * 4)

		const id = new target.ImageData(d, w)

		expect(id.data).to.equal(d)
		expect(id.width).to.equal(w)
		expect(id.height).to.equal(h)
	})

	it('Supports new (width: number, height: number): ImageData', () => {
		const w = 640
		const h = 480

		const id = new target.ImageData(w, h)

		expect(id.data).to.have.lengthOf(w * h * 4)
		expect(id.width).to.equal(w)
		expect(id.height).to.equal(h)
	})

	it('Supports Object.keys(new ImageData(640, 480))', () => {
		const keys = Object.keys(new target.ImageData(640, 480))

		expect(keys).to.have.lengthOf(1)
		expect(keys[0]).to.equal('data')
	})
})
