import { expect } from 'chai'
import { polyfill } from '../mod.js'

describe('CharacterData', () => {
	const target = {}

	before(() => polyfill(target))

	it('Includes CharacterData functionality', () => {
		expect(target).to.have.property('CharacterData')
		expect(target).to.have.property('Text')
		expect(target).to.have.property('Comment')
	})

	it('Supports new Comment', () => {
		expect(() => {
			new target.Comment()
		}).not.to.throw()

		expect(new target.Comment().constructor.name).to.equal('Comment')
		expect(Object.prototype.toString.call(new target.Comment())).to.equal(
			'[object Comment]'
		)

		expect(new target.Comment('hello').data).to.equal('hello')
		expect(new target.Comment('hello').textContent).to.equal('hello')
	})

	it('Supports new Text', () => {
		expect(() => {
			new target.Text()
		}).not.to.throw()

		expect(new target.Text().constructor.name).to.equal('Text')
		expect(Object.prototype.toString.call(new target.Text())).to.equals(
			'[object Text]'
		)

		expect(new target.Text('hello').data).to.equal('hello')
		expect(new target.Text('hello').textContent).to.equal('hello')
	})
})
