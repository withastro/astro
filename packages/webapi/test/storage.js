import { expect } from 'chai'
import { polyfill } from '../mod.js'

describe('Storage', () => {
	const target = {}

	before(() => polyfill(target))

	it('Includes Storage functionality', () => {
		expect(target).to.have.property('Storage').that.is.a('function')
		expect(target).to.have.property('localStorage').that.is.an('object')
	})

	it('Supports Storage methods', () => {
		expect(target.localStorage.setItem('hello', 'world')).to.equal(undefined)
		expect(target.localStorage.getItem('hello')).to.equal('world')
		expect(target.localStorage.key(0)).to.equal('hello')
		expect(target.localStorage.key(1)).to.equal(null)
		expect(target.localStorage.length).to.equal(1)
		expect(target.localStorage.setItem('world', 'hello')).to.equal(undefined)
		expect(target.localStorage.key(1)).to.equal('world')
		expect(target.localStorage.key(2)).to.equal(null)
		expect(target.localStorage.length).to.equal(2)
		expect(target.localStorage.removeItem('hello')).to.equal(undefined)
		expect(target.localStorage.key(0)).to.equal('world')
		expect(target.localStorage.key(1)).to.equal(null)
		expect(target.localStorage.length).to.equal(1)
		expect(target.localStorage.clear()).to.equal(undefined)
		expect(target.localStorage.key(0)).to.equal(null)
		expect(target.localStorage.length).to.equal(0)
	})
})
