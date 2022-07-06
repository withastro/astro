import { Text } from './CharacterData'
import { TreeWalker } from './TreeWalker'
import * as _ from './utils'

export class Document extends Node {
	createElement(name: string) {
		const internals = _.internalsOf<DocumentInternals>(
			this,
			'Document',
			'createElement'
		)

		const customElementInternals: CustomElementRegistryInternals =
			_.INTERNALS.get(internals.target.customElements)

		name = String(name).toLowerCase()

		const TypeOfHTMLElement =
			internals.constructorByName.get(name) ||
			(customElementInternals &&
				customElementInternals.constructorByName.get(name)) ||
			HTMLUnknownElement

		const element = Object.setPrototypeOf(
			new EventTarget(),
			TypeOfHTMLElement.prototype
		) as HTMLElement

		_.INTERNALS.set(element, {
			attributes: {},
			localName: name,
			ownerDocument: this,
			shadowInit: null as unknown as ShadowRootInit,
			shadowRoot: null as unknown as ShadowRoot,
		} as ElementInternals)

		return element
	}

	createNodeIterator(
		root: Node,
		whatToShow: number = NodeFilter.SHOW_ALL,
		filter?: NodeIteratorInternals['filter']
	) {
		const target = Object.create(NodeIterator.prototype)

		_.INTERNALS.set(target, {
			filter,
			pointerBeforeReferenceNode: false,
			referenceNode: root,
			root,
			whatToShow,
		} as NodeIteratorInternals)

		return target
	}

	createTextNode(data: string) {
		return new Text(data)
	}

	createTreeWalker(
		root: Node,
		whatToShow: number = NodeFilter.SHOW_ALL,
		filter?: NodeFilter,
		expandEntityReferences?: boolean
	) {
		const target = Object.create(TreeWalker.prototype)

		_.INTERNALS.set(target, {
			filter,
			currentNode: root,
			root,
			whatToShow,
		} as TreeWalkerInternals)

		return target
	}

	get adoptedStyleSheets(): StyleSheet[] {
		return []
	}

	get styleSheets(): StyleSheet[] {
		return []
	}

	body!: HTMLBodyElement
	documentElement!: HTMLHtmlElement
	head!: HTMLHeadElement
}

export class HTMLDocument extends Document {}

_.allowStringTag(Document)
_.allowStringTag(HTMLDocument)

export const initDocument = (target: Target, exclude: Set<string>) => {
	if (exclude.has('document')) return

	const EventTarget = target.EventTarget || globalThis.EventTarget
	const HTMLDocument = target.HTMLDocument || globalThis.HTMLDocument

	const document: HTMLDocument = (target.document = Object.setPrototypeOf(
		new EventTarget(),
		HTMLDocument.prototype
	))

	_.INTERNALS.set(document, {
		target,
		constructorByName: new Map<string, Function>([
			['body', target.HTMLBodyElement],
			['canvas', target.HTMLCanvasElement],
			['div', target.HTMLDivElement],
			['head', target.HTMLHeadElement],
			['html', target.HTMLHtmlElement],
			['img', target.HTMLImageElement],
			['span', target.HTMLSpanElement],
			['style', target.HTMLStyleElement],
		]),
		nameByConstructor: new Map(),
	} as DocumentInternals)

	const initElement = (name: string, Class: Function) => {
		const target = Object.setPrototypeOf(new EventTarget(), Class.prototype)

		_.INTERNALS.set(target, {
			attributes: {},
			localName: name,
			ownerDocument: document,
			shadowRoot: null as unknown as ShadowRoot,
			shadowInit: null as unknown as ShadowRootInit,
		} as ElementInternals)

		return target
	}

	document.body = initElement('body', target.HTMLBodyElement) as HTMLBodyElement
	document.head = initElement('head', target.HTMLHeadElement) as HTMLHeadElement
	document.documentElement = initElement(
		'html',
		target.HTMLHtmlElement
	) as HTMLHtmlElement
}

interface DocumentInternals {
	body: HTMLBodyElement
	documentElement: HTMLHtmlElement
	head: HTMLHeadElement
	constructorByName: Map<string, Function>
	nameByConstructor: Map<Function, string>
	target: Target
}

interface CustomElementRegistryInternals {
	constructorByName: Map<string, Function>
	nameByConstructor: Map<Function, string>
}

interface ElementInternals {
	attributes: { [name: string]: string }
	localName: string
	ownerDocument: Document
	shadowRoot: ShadowRoot
	shadowInit: ShadowRootInit
}

interface ShadowRootInit extends Record<any, any> {
	mode?: string
}

interface Target extends Record<any, any> {
	HTMLBodyElement: typeof HTMLBodyElement
	HTMLDivElement: typeof HTMLDivElement
	HTMLElement: typeof HTMLElement
	HTMLHeadElement: typeof HTMLHeadElement
	HTMLHtmlElement: typeof HTMLHtmlElement
	HTMLSpanElement: typeof HTMLSpanElement
	HTMLStyleElement: typeof HTMLStyleElement
	customElements: CustomElementRegistry
	document: DocumentInternals
}

interface NodeIteratorInternals {
	filter: NodeFilter
	pointerBeforeReferenceNode: boolean
	referenceNode: Node
	root: Node
	whatToShow: number
}

interface TreeWalkerInternals {
	filter: NodeFilter
	currentNode: Node
	root: Node
	whatToShow: number
}
