import * as _ from './utils'

export class Node extends EventTarget {
	append(...nodesOrDOMStrings: NodeOrString[]): void {
		void nodesOrDOMStrings
	}

	appendChild(childNode: Node): Node {
		return childNode
	}

	after(...nodesOrDOMStrings: NodeOrString[]): void {
		void nodesOrDOMStrings
	}

	before(...nodesOrDOMStrings: NodeOrString[]): void {
		void nodesOrDOMStrings
	}

	prepend(...nodesOrDOMStrings: NodeOrString[]): void {
		void nodesOrDOMStrings
	}

	replaceChild(newChild: Node, oldChild: Node): Node {
		void newChild

		return oldChild
	}

	removeChild(childNode: Node): Node {
		return childNode
	}

	get attributes(): object {
		return {}
	}

	get childNodes(): Node[] {
		return []
	}

	get children(): Element[] {
		return []
	}

	get ownerDocument(): Node | null {
		return null
	}

	get nodeValue(): string {
		return ''
	}

	set nodeValue(value: string) {
		void value
	}

	get textContent(): string {
		return ''
	}

	set textContent(value: string) {
		void value
	}

	get previousElementSibling(): Node | null {
		return null
	}

	get nextElementSibling(): Node | null {
		return null
	}

	[Symbol.for('nodejs.util.inspect.custom')](depth: number, options: Record<string, any>) {
		return `${this.constructor.name}`;
	}
}

export class DocumentFragment extends Node {}

export class ShadowRoot extends DocumentFragment {
	get innerHTML() {
		return ''
	}

	set innerHTML(value: string) {
		void value
	}
}

export const NodeFilter = Object.assign({
	NodeFilter() {
		throw new TypeError('Illegal constructor')
	}
}.NodeFilter, {
	FILTER_ACCEPT: 1,
	FILTER_REJECT: 2,
	FILTER_SKIP: 3,
	SHOW_ALL: 4294967295,
	SHOW_ELEMENT: 1,
	SHOW_ATTRIBUTE: 2,
	SHOW_TEXT: 4,
	SHOW_CDATA_SECTION: 8,
	SHOW_ENTITY_REFERENCE: 16,
	SHOW_ENTITY: 32,
	SHOW_PROCESSING_INSTRUCTION: 64,
	SHOW_COMMENT: 128,
	SHOW_DOCUMENT: 256,
	SHOW_DOCUMENT_TYPE: 512,
	SHOW_DOCUMENT_FRAGMENT: 1024,
	SHOW_NOTATION: 2048,
})

export class NodeIterator {
	nextNode(): Node | null {
		return null
	}

	previousNode(): Node | null {
		return null
	}

	get filter(): NodeFilter {
		const internals = _.internalsOf<NodeIteratorInternals>(this, 'NodeIterator', 'filter')
		return internals.filter
	}

	get pointerBeforeReferenceNode(): boolean {
		const internals = _.internalsOf<NodeIteratorInternals>(this, 'NodeIterator', 'pointerBeforeReferenceNode')
		return internals.pointerBeforeReferenceNode
	}

	get referenceNode(): Node {
		const internals = _.internalsOf<NodeIteratorInternals>(this, 'NodeIterator', 'referenceNode')
		return internals.referenceNode
	}

	get root(): Node {
		const internals = _.internalsOf<NodeIteratorInternals>(this, 'NodeIterator', 'root')
		return internals.root
	}

	get whatToShow(): number {
		const internals = _.internalsOf<NodeIteratorInternals>(this, 'NodeIterator', 'whatToShow')
		return internals.whatToShow
	}
}

_.allowStringTag(Node)
_.allowStringTag(NodeIterator)
_.allowStringTag(DocumentFragment)
_.allowStringTag(ShadowRoot)

type NodeOrString = string | Node

export interface NodeFilter {
	acceptNode(node: Node): number
}

export interface NodeIteratorInternals {
	filter: NodeFilter
	pointerBeforeReferenceNode: boolean
	referenceNode: Node
	root: Node
	whatToShow: number
}
