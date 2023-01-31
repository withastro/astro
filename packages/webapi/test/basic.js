import { expect } from 'chai'
import { polyfill } from '../mod.js'

describe('Basic', () => {
	before(() => polyfill(globalThis))

	it('Globals exist', () => {
		const webAPIs = [
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
})
