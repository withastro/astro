import { expect } from 'chai'
import { polyfill } from '../mod.js'

describe('Options', () => {
	it('Can exclude HTMLElement+', () => {
		const target = {}

		polyfill(target, {
			exclude: 'HTMLElement+',
		})

		expect(target).to.have.property('Event')
		expect(target).to.have.property('EventTarget')
		expect(target).to.have.property('Element')
		expect(target).to.not.have.property('HTMLElement')
		expect(target).to.not.have.property('HTMLDivElement')
	})

	it('Can exclude Event+', () => {
		const target = {}

		polyfill(target, {
			exclude: 'Event+',
		})

		expect(target).to.not.have.property('Event')
		expect(target).to.not.have.property('EventTarget')
		expect(target).to.not.have.property('Element')
		expect(target).to.not.have.property('HTMLElement')
		expect(target).to.not.have.property('HTMLDivElement')
	})

	it('Can exclude document', () => {
		const target = {}

		polyfill(target, {
			exclude: 'document',
		})

		expect(target).to.have.property('Document')
		expect(target).to.have.property('HTMLDocument')
		expect(target).to.not.have.property('document')
	})
})
