import * as _ from './utils'

export class Element extends Node {
	hasAttribute(name: string): boolean {
		void name

		return false
	}

	getAttribute(name: string): string | null {
		return null
	}

	setAttribute(name: string, value: string): void {
		void name
		void value
	}

	removeAttribute(name: string): void {
		void name
	}

	attachShadow(init: Partial<ShadowRootInit>) {
		if (arguments.length < 1) throw new TypeError(`Failed to execute 'attachShadow' on 'Element': 1 argument required, but only 0 present.`)

		if (init !== Object(init)) throw new TypeError(`Failed to execute 'attachShadow' on 'Element': The provided value is not of type 'ShadowRootInit'.`)

		if (init.mode !== 'open' && init.mode !== 'closed') throw new TypeError(`Failed to execute 'attachShadow' on 'Element': Failed to read the 'mode' property from 'ShadowRootInit': The provided value '${init.mode}' is not a valid enum value of type ShadowRootMode.`)

		const internals = _.internalsOf<ElementInternals>(this, 'Element', 'attachShadow')

		if (internals.shadowRoot) throw new Error('The operation is not supported.')

		internals.shadowInit = internals.shadowInit || {
			mode: init.mode,
			delegatesFocus: Boolean(init.delegatesFocus),
		}

		internals.shadowRoot = internals.shadowRoot || (/^open$/.test(internals.shadowInit.mode as string) ? Object.setPrototypeOf(new EventTarget(), ShadowRoot.prototype) as ShadowRoot : null)

		return internals.shadowRoot
	}

	get assignedSlot(): HTMLSlotElement | null {
		return null
	}

	get innerHTML(): string {
		_.internalsOf<ElementInternals>(this, 'Element', 'innerHTML')

		return ''
	}

	set innerHTML(value) {
		_.internalsOf<ElementInternals>(this, 'Element', 'innerHTML')

		void value
	}

	get shadowRoot(): ShadowRoot | null {
		const internals = _.internalsOf<ElementInternals>(this, 'Element', 'shadowRoot')

		return Object(internals.shadowInit).mode === 'open' ? internals.shadowRoot : null
	}

	get localName(): string {
		return _.internalsOf<ElementInternals>(this, 'Element', 'localName').localName as string
	}

	get nodeName(): string {
		return (_.internalsOf<ElementInternals>(this, 'Element', 'nodeName').localName as string).toUpperCase()
	}

	get tagName(): string {
		return (_.internalsOf<ElementInternals>(this, 'Element', 'tagName').localName as string).toUpperCase()
	}
}

export class HTMLElement extends Element {}

export class HTMLBodyElement extends HTMLElement {}

export class HTMLDivElement extends HTMLElement {}

export class HTMLHeadElement extends HTMLElement {}

export class HTMLHtmlElement extends HTMLElement {}

export class HTMLSpanElement extends HTMLElement {}

export class HTMLStyleElement extends HTMLElement {}

export class HTMLTemplateElement extends HTMLElement {}

export class HTMLUnknownElement extends HTMLElement {}

_.allowStringTag(Element)
_.allowStringTag(HTMLElement)
_.allowStringTag(HTMLBodyElement)
_.allowStringTag(HTMLDivElement)
_.allowStringTag(HTMLHeadElement)
_.allowStringTag(HTMLHtmlElement)
_.allowStringTag(HTMLSpanElement)
_.allowStringTag(HTMLStyleElement)
_.allowStringTag(HTMLTemplateElement)
_.allowStringTag(HTMLUnknownElement)

export interface ElementInternals {
	attributes: { [name: string]: string },
	localName?: string
	shadowRoot: ShadowRoot | null
	shadowInit: ShadowRootInit | void
}

export interface ShadowRootInit {
	mode: 'open' | 'closed'
	delegatesFocus: boolean
}