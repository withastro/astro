import { assert, test } from '../run/test.setup.js'
import { polyfill } from '../mod.js'

test(() => {
	return [
		{
			name: 'Includes CharacterData functionality',
			test() {
				const target = {}

				polyfill(target)

				assert.equal(Reflect.has(target, 'CharacterData'), true)
				assert.equal(Reflect.has(target, 'Text'), true)
				assert.equal(Reflect.has(target, 'Comment'), true)
			},
		},
		{
			name: 'Throws new CharacterData',
			test() {
				const target = {}

				polyfill(target)
			},
		},
		{
			name: 'Supports new Comment',
			test() {
				const target = polyfill({})

				assert.doesNotThrow(() => {
					new target.Comment()
				})

				assert.equal(new target.Comment().constructor.name, 'Comment')
				assert.equal(Object.prototype.toString.call(new target.Comment()), '[object Comment]')

				assert.equal(new target.Comment('hello').data, 'hello')
				assert.equal(new target.Comment('hello').textContent, 'hello')
			},
		},
		{
			name: 'Supports new Text',
			test() {
				const target = polyfill({})

				assert.doesNotThrow(() => {
					new target.Text()
				})

				assert.equal(new target.Text().constructor.name, 'Text')
				assert.equal(Object.prototype.toString.call(new target.Text()), '[object Text]')

				assert.equal(new target.Text('hello').data, 'hello')
				assert.equal(new target.Text('hello').textContent, 'hello')
			},
		},
	]
})
