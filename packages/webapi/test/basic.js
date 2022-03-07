import { assert, test } from '../run/test.setup.js'
import { polyfill } from '../mod.js'

test(() => {
	polyfill(globalThis)

	return [
		{
			name: 'Globals exist',
			test() {
				const webAPIs = [
					'AbortController',
					'AbortSignal',
					'Blob',
					'ByteLengthQueuingStrategy',
					'CSSStyleSheet',
					'CountQueuingStrategy',
					'CustomElementRegistry',
					'CustomEvent',
					'DOMException',
					'Document',
					'DocumentFragment',
					'Element',
					'Event',
					'EventTarget',
					'File',
					'FormData',
					'HTMLDocument',
					'HTMLElement',
					'HTMLDivElement',
					'HTMLHeadElement',
					'HTMLHtmlElement',
					'HTMLImageElement',
					'HTMLStyleElement',
					'HTMLTemplateElement',
					'HTMLUnknownElement',
					'Headers',
					'IntersectionObserver',
					'Image',
					'MediaQueryList',
					'MutationObserver',
					'Node',
					'ReadableByteStreamController',
					'ReadableStream',
					'ReadableStreamBYOBReader',
					'ReadableStreamBYOBRequest',
					'ReadableStreamDefaultController',
					'ReadableStreamDefaultReader',
					'Request',
					'Response',
					'ShadowRoot',
					'StyleSheet',
					'TransformStream',
					'WritableStream',
					'WritableStreamDefaultController',
					'WritableStreamDefaultWriter',
					'Window',
					'cancelAnimationFrame',
					'cancelIdleCallback',
					'clearTimeout',
					'fetch',
					'requestAnimationFrame',
					'requestIdleCallback',
					'setTimeout',
				]

				for (const name of webAPIs) {
					assert.equal(typeof globalThis[name], 'function')
				}
			},
		},
		{
			name: 'Constructs an Event',
			test() {
				const e = new Event('test')

				assert.equal(e.type, 'test')
			},
		},
		{
			name: 'Constructs an EventTarget',
			test() {
				const t = new EventTarget()
			},
		},
		{
			name: 'Dispatches an Event on an EventTarget',
			test() {
				const t = new EventTarget()

				let pass = false

				t.addEventListener('test', (event) => {
					pass = true
				})

				const e = new Event('test')

				t.dispatchEvent(e)

				assert.equal(pass, true)
			},
		},
		{
			name: 'Classes extend as expected',
			test() {
				assert.equal(HTMLElement.prototype instanceof Element, true)
				assert.equal(Element.prototype instanceof Node, true)
				assert.equal(Node.prototype instanceof EventTarget, true)
			},
		},
		{
			name: 'DOM Methods have no effect',
			test() {
				const element = document.createElement('div')

				assert.equal(element.innerHTML, '')
				element.innerHTML = 'frozen'
				assert.equal(element.innerHTML, '')

				assert.equal(element.textContent, '')
				element.textContent = 'frozen'
				assert.equal(element.textContent, '')
			},
		},
		{
			name: 'globalThis.window === globalThis',
			test() {
				assert.equal(globalThis.window, globalThis)
			},
		},
		{
			name: 'Relative Indexing Method (String#at)',
			test() {
				assert.equal(typeof String.prototype.at, 'function')
				assert.equal(String.prototype.at.length, 1)

				const example = 'The quick brown fox jumps over the lazy dog.'

				assert.equal(example.at(2), 'e')
				assert.equal(example.at(-2), 'g')
			},
		},
		{
			name: 'Relative Indexing Method (Array#at)',
			test() {
				assert.equal(typeof Array.prototype.at, 'function')
				assert.equal(Array.prototype.at.length, 1)

				const example = [1, 3, 5, 7, 9]

				assert.equal(example.at(1), 3)
				assert.equal(example.at(-1), 9)
			},
		},
		{
			name: 'Relative Indexing Method (TypedArray#at)',
			test() {
				assert.equal(typeof Int8Array.prototype.at, 'function')
				assert.equal(Int8Array.prototype.at.length, 1)

				const example = new Int8Array([1, 3, 5, 7, 9])

				assert.equal(example.at(1), 3)
				assert.equal(example.at(-1), 9)
			},
		},
		{
			name: 'Object.hasOwn',
			test() {
				assert.equal(typeof Object.hasOwn, 'function')
				assert.equal(Object.hasOwn.length, 2)

				const example = {}

				assert.equal(Object.hasOwn(example, 'prop'), false)

				example.prop = 'exists'

				assert.equal(Object.hasOwn(example, 'prop'), true)
			},
		},
		{
			name: 'Promise.any',
			test() {
				assert.equal(typeof Promise.any, 'function')
				assert.equal(Promise.any.length, 1)

				Promise.any([
					Promise.resolve(42),
					Promise.reject(-1),
					Promise.reject(Infinity),
				]).then((result) => {
					assert.equal(result, 42)
				})
			},
		},
		{
			name: 'String#replaceAll',
			test() {
				assert.equal(typeof String.prototype.replaceAll, 'function')
				assert.equal(String.prototype.replaceAll.length, 2)

				const t1 =
					'Of all the sorcerers in Harry Potter, Halo is my favorite sorcerer.'
				const t2 = t1.replaceAll('sorcerer', 'philosopher')
				const t3 =
					'Of all the philosophers in Harry Potter, Halo is my favorite philosopher.'

				assert.equal(t2, t3)
			},
		},
	]
})
