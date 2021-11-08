/* The purpose of this file is to prevent a web component file from throwing during import. */
/* The classes and methods here are not intended to recreate the Document Object Model. */
/* The functionalities here are placeholder shims to access top-level DOM objects. */

// add utilities for handling internal data

const INTERNALS = new WeakMap()

const INTERNALS_FOR = (ref) => INTERNALS.has(ref) ? INTERNALS.get(ref) : INTERNALS.set(ref, {}).get(ref)

/** @type {<T>(value: T, internals: {}, prop: string) => T} */
const REGISTER = (value, internals, name = Object(value).name) => {
	if (globalThis[name] === undefined) {
		globalThis[name] = value
	}

	Object.assign(INTERNALS_FOR(value), internals)

	return value
}

// shim event target constructors

/** Event interface representing an event which takes place. */
export const Event = REGISTER(globalThis.Event || class Event {})

/** Event interface representing an event which takes place. */
export const CustomEvent = REGISTER(globalThis.CustomEvent || class CustomEvent extends Event {})

/** EventTarget interface representing any object that can handle events. */
export const EventTarget = REGISTER(globalThis.EventTarget || class EventTarget {
	addEventListener(/** @type {string} */ type, /** @type {any} */ listener) {
		void type
		void listener
	}

	dispatchEvent(/** @type {Event} */ event) {
		void event

		return true
	}

	removeEventListener(/** @type {string} */ type, /** @type {any} */ listener) {
		void type
		void listener
	}
})

export const Window = REGISTER(globalThis.Window || class Window extends EventTarget {
	cancelAnimationFrame(/** @type {number} */ id) {
		return clearTimeout(id)
	}

	cancelIdleCallback(/** @type {number} */ id) {
		return clearTimeout(id)
	}

	matchMedia(/** @type {string} */ mediaQueryString) {
		void mediaQueryString

		/** @type {MediaQueryList} */
		const mediaQueryList = Object.create(MediaQueryList.prototype)

		return mediaQueryList
	}

	requestAnimationFrame(/** @type {Function} */ callback) {
		return setTimeout(callback, 1000 / 60)
	}

	requestIdleCallback(/** @type {Function} */ callback) {
		void callback

		return setTimeout(callback, 1000 / 60)
	}

	get customElements() {
		/** @type {WindowInternals} */
		const _internals = INTERNALS_FOR(this)

		return _internals.customElements
	}

	get document() {
		/** @type {WindowInternals} */
		const _internals = INTERNALS_FOR(this)

		return _internals.document
	}

	get location() {
		/** @type {WindowInternals} */
		const _internals = INTERNALS_FOR(this)

		return _internals.location
	}

	get window() {
		return this
	}
})

/** MediaQueryList interface representing media queries applied to a document. */
export const MediaQueryList = REGISTER(globalThis.MediaQueryList || class MediaQueryList extends EventTarget {})

/** Node interface representing the base class for all DOM objects. */
export const Node = REGISTER(globalThis.Node || class Node extends EventTarget {
	append(/** @type {NodeOrString[]} */ ...nodesOrDOMStrings) {
		void nodesOrDOMStrings
	}

	appendChild(/** @type {Node} */ childNode) {
		return childNode
	}

	after(/** @type {NodeOrString[]} */ ...nodesOrDOMStrings) {
		void nodesOrDOMStrings
	}

	before(/** @type {NodeOrString[]} */ ...nodesOrDOMStrings) {
		void nodesOrDOMStrings
	}

	prepend(/** @type {NodeOrString[]} */ ...nodesOrDOMStrings) {
		void nodesOrDOMStrings
	}

	replaceChild(/** @type {Node} */ newChild, /** @type {Node} */ oldChild) {
		void newChild

		return oldChild
	}

	removeChild(/** @type {Node} */ childNode) {
		return childNode
	}

	get attributes() {
		return {}
	}

	/** @type {Node[]} */ 
	get childNodes() {
		return []
	}

	/** @type {Element[]} */ 
	get children() {
		return []
	}

	get ownerDocument() {
		/** @type {NodeInternals} */
		const internals = INTERNALS_FOR(this)

		internals.ownerDocument = internals.ownerDocument || null

		return internals.ownerDocument
	}

	get textContent() {
		return ''
	}
})

/** Element interface representing the base class for all element objects. */
export const Element = REGISTER(globalThis.Element || class Element extends Node {
	hasAttribute(/** @type {string} */ name) {
		void name

		return false
	}

	getAttribute(/** @type {string} */ name) {
		void name

		return null
	}

	setAttribute(/** @type {string} */ name, /** @type {string} */ value) {
		void name
		void value
	}

	attachShadow(/** @type {{ mode?: string }} */ init) {
		/** @type {ElementInternals} */
		const internals = INTERNALS_FOR(this)

		if (internals.shadowRoot) throw new Error('The operation is not supported.')

		internals.shadowInit = internals.shadowInit || Object(init)
		internals.shadowRoot = internals.shadowRoot || (/^open$/.test(internals.shadowInit.mode) ? new ShadowRoot : null)

		return internals.shadowRoot
	}

	get innerHTML() {
		/** @type {ElementInternals} */
		const internals = INTERNALS_FOR(this)

		return internals.innerHTML
	}

	set innerHTML(value) {
		/** @type {ElementInternals} */
		const internals = INTERNALS_FOR(this)

		internals.innerHTML = String(value)
	}

	get shadowRoot() {
		/** @type {ElementInternals} */
		const internals = INTERNALS_FOR(this)

		internals.shadowInit = internals.shadowInit || {}
		internals.shadowRoot = internals.shadowRoot || null

		const shadowRootOrNull = /^open$/.test(internals.shadowInit.mode) ? internals.shadowRoot : null

		return shadowRootOrNull
	}

	get nodeName() {
		/** @type {ElementInternals} */
		const internals = INTERNALS_FOR(this)

		return internals.name || ''
	}

	get tagName() {
		/** @type {ElementInternals} */
		const internals = INTERNALS_FOR(this)

		return internals.name || ''
	}
})

/** Document interface representing an entire document tree. */
export const Document = REGISTER(globalThis.Document || class Document extends Node {
	createElement(/** @type {string} */ name) {
		name = String(name).toUpperCase()

		/** @type {ElementRegistryInternals} */
		const internals = INTERNALS_FOR(this.defaultView.customElements)

		const TypeOfHTMLElement = internals.constructorByName.get(name) || HTMLUnknownElement

		/** @type {HTMLElement} */ 
		const element = Object.create(TypeOfHTMLElement.prototype)

		Object.assign(INTERNALS_FOR(element), { name, ownerDocument: this })

		return element
	}

	/** @type {StyleSheet[]} */
	get adoptedStyleSheets() {
		return []
	}

	get body() {
		/** @type {DocumentInternals} */
		const internals = INTERNALS_FOR(this)

		return internals.body || null
	}

	get defaultView() {
		/** @type {DocumentInternals} */
		const internals = INTERNALS_FOR(this)

		return internals.defaultView || null
	}

	get documentElement() {
		/** @type {DocumentInternals} */
		const internals = INTERNALS_FOR(this)

		return internals.documentElement || null
	}

	get head() {
		/** @type {DocumentInternals} */
		const internals = INTERNALS_FOR(this)

		return internals.head || null
	}

	/** @type {StyleSheet[]} */
	get styleSheets() {
		return []
	}
})

/** Document interface representing a minimal document tree. */
export const DocumentFragment = REGISTER(globalThis.DocumentFragment || class DocumentFragment extends Node {})

/** Document interface representing a document subtree. */
export const ShadowRoot = REGISTER(globalThis.ShadowRoot || class ShadowRoot extends DocumentFragment {
	get innerHTML() {
		return ''
	}
})

/** HTMLDocument interface representing an entire HTML document tree. */
export const HTMLDocument = REGISTER(globalThis.HTMLDocument || class HTMLDocument extends Document {})

/** HTMLElement interface representing any HTML element. */
export const HTMLElement = REGISTER(globalThis.HTMLElement || class HTMLElement extends Element {})

export const HTMLDivElement = REGISTER(globalThis.HTMLDivElement || class HTMLDivElement extends HTMLElement {})

export const HTMLHeadElement = REGISTER(globalThis.HTMLHeadElement || class HTMLHeadElement extends HTMLElement {})

export const HTMLHtmlElement = REGISTER(globalThis.HTMLHtmlElement || class HTMLHtmlElement extends HTMLElement {})

export const HTMLImageElement = REGISTER(globalThis.HTMLImageElement || class HTMLImageElement extends HTMLElement {})

export const HTMLStyleElement = REGISTER(globalThis.HTMLStyleElement || class HTMLStyleElement extends HTMLElement {})

export const HTMLTemplateElement = REGISTER(globalThis.HTMLTemplateElement || class HTMLTemplateElement extends HTMLElement {})

export const HTMLUnknownElement = REGISTER(globalThis.HTMLUnknownElement || class HTMLUnknownElement extends HTMLElement {})

export const Image = REGISTER(globalThis.Image || function Image() {
	Object.assign(INTERNALS_FOR(this), { name: 'img', ownerDocument: globalThis.document })
})

Image.prototype = HTMLImageElement.prototype

/** CustomElementRegistry used to register new custom elements and get information about previously registered custom elements. */
export const CustomElementRegistry = REGISTER(globalThis.CustomElementRegistry || class CustomElementRegistry {
	/** Defines a new custom element using the given tag name and HTMLElement constructor. */
	define(/** @type {string} */ name, /** @type {typeof HTMLElement} */ constructor, options) {
		void options

		/** @type {ElementRegistryInternals} */
		const internals = INTERNALS_FOR(this)

		name = String(name).toUpperCase()

		internals.constructorByName.set(name, constructor)
		internals.nameByConstructor.set(constructor, name)
	}

	/** Returns the constructor associated with the given tag name. */
	get(/** @type {string} */ name) {
		/** @type {ElementRegistryInternals} */
		const internals = INTERNALS_FOR(this)

		name = String(name).toUpperCase()

		return internals.constructorByName.get(name)
	}
})

export const StyleSheet = REGISTER(globalThis.StyleSheet || class StyleSheet {})

export const CSSStyleSheet = REGISTER(globalThis.CSSStyleSheet || class CSSStyleSheet extends StyleSheet {
	async replace(/** @type {string} */ text) {
		void text

		return new CSSStyleSheet()
	}

	replaceSync(/** @type {string} */ text) {
		void text

		return new CSSStyleSheet()
	}

	get cssRules() {
		return []
	}
})

/** MutationObserver provides the ability to watch for changes to the DOM tree. */
export const MutationObserver = REGISTER(globalThis.MutationObserver || class MutationObserver {
	disconnect() {}

	observe() {}

	takeRecords() {
		return []
	}

	unobserve() {}
})

/** IntersectionObserver provides the ability to watch for changes in the intersection of elements. */
export const IntersectionObserver = REGISTER(globalThis.IntersectionObserver || class IntersectionObserver {
	disconnect() {}

	observe() {}

	takeRecords() {
		return []
	}

	unobserve() {}
})

/** ResizeObserver provides the ability to watch for changes made to the dimensions of elements. */
export const ResizeObserver = REGISTER(globalThis.ResizeObserver || class ResizeObserver {
	disconnect() {}

	observe() {}

	takeRecords() {
		return []
	}

	unobserve() {}
})

// shim globalThis as an instance of Window

if (!(globalThis instanceof Window)) {
	Object.setPrototypeOf(globalThis, Window.prototype)

	Object.assign(INTERNALS_FOR(globalThis), {
		customElements: globalThis.customElements || new CustomElementRegistry(),
		document: globalThis.document || new HTMLDocument(),
		location: globalThis.location || new URL('http://0.0.0.0/'),
	})

	Object.assign(INTERNALS_FOR(globalThis.customElements), {
		constructorByName: new Map([
			['DIV', HTMLDivElement],
			['HTML', HTMLHtmlElement],
			['IMG', HTMLImageElement],
			['STYLE', HTMLStyleElement],
			['TEMPLATE', HTMLTemplateElement],
		]),
		nameByConstructor: new Map([
			[HTMLDivElement, 'DIV'],
			[HTMLHtmlElement, 'HTML'],
			[HTMLImageElement, 'IMG'],
			[HTMLStyleElement, 'STYLE'],
			[HTMLTemplateElement, 'TEMPLATE'],
		]),
	})

	Object.assign(INTERNALS_FOR(globalThis.document), {
		documentElement: Object.create(HTMLHtmlElement.prototype),
		body: null,
		defaultView: globalThis.window,
		head: Object.create(HTMLHeadElement.prototype)
	})

	Object.assign(INTERNALS_FOR(globalThis.document.documentElement), {
		name: 'HTML',
		ownerDocument: globalThis.document,
	})

	Object.assign(INTERNALS_FOR(globalThis.document.head), {
		name: 'HEAD',
		ownerDocument: globalThis.document,
	})
}

export const window = globalThis.window
export const customElements = globalThis.customElements
export const document = globalThis.document

// utilities for working with internals

/** Returns an Element constructor by a given tag name. */
export const getTypeOfElementByName = (/** @type {string} */ name) => {
	name = String(name).toUpperCase()

	/** @type {ElementRegistryInternals} */
	const internals = INTERNALS_FOR(customElements)

	return internals.constructorByName.get(name)
}

/** Returns a tag name by a given Element constructor. */
export const getNameByTypeOfElement = (/** @type {typeof HTMLElement} */ TypeOfHTMLElement) => {
	/** @type {ElementRegistryInternals} */
	const internals = INTERNALS_FOR(customElements)

	return internals.nameByConstructor.get(TypeOfHTMLElement) || null
}

/** @typedef {{ ownerDocument: Document }} NodeInternals */
/** @typedef {{ customElements: CustomElementRegistry, document: HTMLDocument, location: URL }} WindowInternals */
/** @typedef {{ body: HTMLElement, defaultView: WindowOrWorkerGlobalScope, documentElement: HTMLHtmlElement, head: HTMLHeadElement }} DocumentInternals */
/** @typedef {{ name: string, innerHTML: string, shadowRoot: ShadowRoot, shadowInit: { mode?: string } }} ElementInternals */
/** @typedef {{ constructorByName: Map<string, typeof HTMLElement>, nameByConstructor: Map<typeof HTMLElement, string> }} ElementRegistryInternals */
/** @typedef {string | Node} NodeOrString */
