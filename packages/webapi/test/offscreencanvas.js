import { expect } from 'chai'
import { polyfill } from '../mod.js'

describe('OffscreenCanvas', () => {
	const target = {}

	before(() => polyfill(target))

	it('Supports OffscreenCanvas', () => {
		expect(target).to.have.property('OffscreenCanvas').that.is.a('function')
	})

	it('Supports new (width: number, height: number): OffscreenCanvas', () => {
		const w = 640
		const h = 480

		const canvas = new target.OffscreenCanvas(w, h)

		expect(canvas.width).to.equal(w)
		expect(canvas.height).to.equal(h)
	})

	it('Supports OffscreenCanvas#getContext', () => {
		const w = 640
		const h = 480

		const canvas = new target.OffscreenCanvas(w, h)

		const context = canvas.getContext('2d')

		expect(context.canvas).to.equal(canvas)

		const imageData = context.createImageData(w, h)

		expect(imageData.width).to.equal(w)
		expect(imageData.height).to.equal(h)
		expect(imageData.data).to.have.lengthOf(w * h * 4)
	})
})
