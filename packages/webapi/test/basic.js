import { expect } from 'chai'
import { polyfill } from '../mod.js'

describe('Basic', () => {
	before(() => polyfill(globalThis))

	it('Globals exist', () => {
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
			expect(globalThis[name]).to.be.a('function')
		}
	})

	it('Constructs an Event', () => {
		const e = new Event('test')

		expect(e.type).to.equal('test')
	})

	it('Constructs an EventTarget', () => {
		const _t = new EventTarget()
	})

	it('Dispatches an Event on an EventTarget', () => {
		const t = new EventTarget()

		let pass = false

		t.addEventListener('test', (event) => {
			pass = true
		})

		const e = new Event('test')

		t.dispatchEvent(e)

		expect(pass).to.equal(true)
	})

	it('Classes extend as expected', () => {
		expect(HTMLElement.prototype).to.be.an.instanceof(Element)
		expect(Element.prototype).to.be.an.instanceof(Node)
		expect(Node.prototype).to.be.an.instanceof(EventTarget)
	})

	it('DOM Methods have no effect', () => {
		const element = document.createElement('div')

		expect(element.innerHTML).to.be.empty
		element.innerHTML = 'frozen'
		expect(element.innerHTML).to.be.empty

		expect(element.textContent).to.be.empty
		element.textContent = 'frozen'
		expect(element.textContent).to.be.empty
	})

	it('globalThis.window === globalThis', () => {
		expect(globalThis.window).to.equal(globalThis)
	})

	it('Relative Indexing Method (String#at)', () => {
		expect(String.prototype.at).to.be.a('function')
		expect(String.prototype.at.length).to.equal(1)

		const example = 'The quick brown fox jumps over the lazy dog.'

		expect(example.at(2)).to.equal('e')
		expect(example.at(-2)).to.equal('g')
	})

	it('Relative Indexing Method (Array#at)', () => {
		expect(Array.prototype.at).to.be.a('function')
		expect(Array.prototype.at.length).to.equal(1)

		const example = [1, 3, 5, 7, 9]

		expect(example.at(1)).to.equal(3)
		expect(example.at(-1)).to.equal(9)
	})

	it('Relative Indexing Method (TypedArray#at)', () => {
		expect(Int8Array.prototype.at).to.be.a('function')
		expect(Int8Array.prototype.at.length).to.equal(1)

		const example = new Int8Array([1, 3, 5, 7, 9])

		expect(example.at(1)).to.equal(3)
		expect(example.at(-1)).to.equal(9)
	})

	it('Object.hasOwn', () => {
		expect(Object.hasOwn).to.be.a('function')
		expect(Object.hasOwn.length).to.equal(2)

		const example = {}

		expect(Object.hasOwn(example, 'prop')).to.equal(false)

		example.prop = 'exists'

		expect(Object.hasOwn(example, 'prop')).to.equal(true)
	})

	it('Promise.any', () => {
		expect(Promise.any).to.be.a('function')
		expect(Promise.any.length).to.equal(1)

		Promise.any([
			Promise.resolve(42),
			Promise.reject(-1),
			Promise.reject(Infinity),
		]).then((result) => {
			expect(result).to.equal(42)
		})
	})

	it('String#replaceAll', () => {
		expect(String.prototype.replaceAll).to.be.a('function')
		expect(String.prototype.replaceAll.length).to.equal(2)

		const t1 =
			'Of all the sorcerers in Harry Potter, Halo is my favorite sorcerer.'
		const t2 = t1.replaceAll('sorcerer', 'philosopher')
		const t3 =
			'Of all the philosophers in Harry Potter, Halo is my favorite philosopher.'

		expect(t2).to.equal(t3)
	})
})
