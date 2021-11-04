/* The purpose of this file is to prevent a web component file from throwing during import. */
/* The classes and methods here are not intended to recreate the Document Object Model. */
/* The functionalities here are placeholder shims to access top-level DOM objects. */

class InternalMap extends WeakMap {
	get(ref, els) {
		return super.has(ref) ? super.get(ref) : super.set(ref, els) && els
	}
}

const internal = new InternalMap()

/** EventTarget interface representing any object that can handle events. */
export const EventTarget = globalThis.EventTarget || class EventTarget {}

/** Node interface representing the base class for all DOM objects. */
export const Node = globalThis.Node || class Node extends EventTarget {
	append() {}

	appendChild(childNode) {
		return childNode
	}

	after() {}

	before() {}

	replaceChild(newChild, oldChild) {
		return oldChild
	}

	removeChild(childNode) {
		return childNode
	}

	get children() {
		return []
	}

	get childNodes() {
		return []
	}

	get attributes() {
		return {}
	}

	/** Content contained within the current node. */
	get textContent() {
		return ''
	}
}

/** Element interface representing the base class for all element objects. */
export const Element = globalThis.Element || class Element extends Node {
	hasAttribute(name) {
		return false
	}

	getAttribute(name) {
		return null
	}

	setAttribute(name, value) {}

	attachShadow(init) {
		init = Object(init)

		let _internal = internal.get(this, { shadowInit: {}, shadowRoot: null })

		if (_internal.shadowRoot) throw new Error('The operation is not supported.')

		_internal.shadowInit = Object(init)
		_internal.shadowRoot = new ShadowRoot()

		internal.get(_internal.shadowRoot, {}).host = this

		return _internal.shadowRoot
	}

	get innerHTML() {
		return ''
	}

	get nodeName() {
		return internal.get(this, {}).tagName || ''
	}

	get shadowRoot() {
		const isOpenShadowRoot = /^open$/i.test(internal.get(this, {}).shadowInit?.mode)

		return isOpenShadowRoot ? internal.get(this, { shadowRoot: null }).shadowRoot : null
	}

	get tagName() {
		return internal.get(this, {}).tagName || ''
	}
}

/** Document interface representing an entire document tree. */
export const Document = globalThis.Document || class Document extends Node {
	createElement(name) {
		name = String(name).toUpperCase()

		const element = Object.create((internal.get(this, {}).customElements?.constructorByName?.get(name) || HTMLElement).prototype)

		internal.set(element, { tagName: name })

		return element
	}

	get adoptedStyleSheets() {
		return []
	}

	get styleSheets() {
		return []
	}
}

/** Document interface representing a minimal document tree. */
export const DocumentFragment = globalThis.DocumentFragment || class DocumentFragment extends Node {}

/** Document interface representing a document subtree. */
export const ShadowRoot = globalThis.ShadowRoot || class ShadowRoot extends DocumentFragment {
	get innerHTML() {
		return ''
	}
}

/** HTMLDocument interface representing an entire HTML document tree. */
export const HTMLDocument = globalThis.HTMLDocument || class HTMLDocument extends Document {}

/** HTMLElement interface representing any HTML element. */
export const HTMLElement = globalThis.HTMLElement || class HTMLElement extends Element {}

/** CustomElementRegistry used to register new custom elements and get information about previously registered custom elements. */
export const CustomElementRegistry = globalThis.CustomElementRegistry || class CustomElementRegistry {
	/** Defines a new custom element using the given tag name and HTMLElement constructor. */
	define(name, constructor, options) {
		name = String(name).toUpperCase()

		const _internal = internal.get(this, { constructorByName: new Map(), nameByConstructor: new InternalMap() })

		_internal.constructorByName = _internal.constructorByName || new Map()
		_internal.nameByConstructor = _internal.nameByConstructor || new InternalMap()

		_internal.constructorByName.set(name, constructor)
		_internal.nameByConstructor.set(constructor, name)
	}

	/** Returns the constructor associated with the given tag name. */
	get(name) {
		name = String(name).toUpperCase()

		return internal.get(this, {}).constructorByName?.get(name)
	}
}

export const StyleSheet = globalThis.StyleSheet || class StyleSheet {}

export const CSSStyleSheet = globalThis.CSSStyleSheet || class CSSStyleSheet extends StyleSheet {
	replace() {}
}

/** MutationObserver provides the ability to watch for changes to the DOM tree. */
export const MutationObserver = globalThis.MutationObserver || class MutationObserver {
	disconnect() {}

	observe() {}

	takeRecords() {
		return []
	}

	unobserve() {}
}

/** IntersectionObserver provides the ability to watch for changes in the intersection of elements. */
export const IntersectionObserver = globalThis.IntersectionObserver || class IntersectionObserver {
	disconnect() {}

	observe() {}

	takeRecords() {
		return []
	}

	unobserve() {}
}

/** ResizeObserver provides the ability to watch for changes made to the dimensions of elements. */
export const ResizeObserver = globalThis.ResizeObserver || class ResizeObserver {
	disconnect() {}

	observe() {}

	takeRecords() {
		return []
	}

	unobserve() {}
}

// shim dom objects onto the global object

globalThis.CSSStyleSheet = CSSStyleSheet
globalThis.CustomElementRegistry = CustomElementRegistry
globalThis.Document = Document
globalThis.DocumentFragment = DocumentFragment
globalThis.Element = Element
globalThis.EventTarget = EventTarget
globalThis.HTMLDocument = HTMLDocument
globalThis.HTMLElement = HTMLElement
globalThis.IntersectionObserver = IntersectionObserver
globalThis.MutationObserver = MutationObserver
globalThis.Node = Node
globalThis.ResizeObserver = ResizeObserver
globalThis.ShadowRoot = ShadowRoot
globalThis.StyleSheet = StyleSheet

globalThis.cancelAnimationFrame = globalThis.cancelAnimationFrame || clearTimeout
globalThis.cancelIdleCallback = globalThis.cancelIdleCallback || clearTimeout
globalThis.customElements = globalThis.customElements || new CustomElementRegistry()
globalThis.document = globalThis.document || new HTMLDocument()
globalThis.document.head = globalThis.document.head || globalThis.document.createElement('head')
globalThis.document.body = globalThis.document.body || null
globalThis.location = globalThis.location || new URL('http://localhost')
globalThis.requestAnimationFrame = globalThis.requestAnimationFrame || setTimeout
globalThis.requestIdleCallback = globalThis.requestIdleCallback || setTimeout

if (!globalThis.window) globalThis.window = globalThis.document.window = globalThis

// utilities for custom element handling

internal.set(globalThis.document, {
	customElements: internal.get(customElements, {})
})

/** Returns a Custom Element by a given tag name. */
export const getCustomElementByName = (name) => {
	name = String(name).toUpperCase()

	return internal.get(globalThis.customElements, {}).constructorByName?.get(name)
}

/** Returns a tag names by a given Custom Element. */
export const getNameByCustomElement = (constructor) => {
	return internal.get(globalThis.customElements, {}).nameByConstructor?.get(constructor)?.toLowerCase()
}
