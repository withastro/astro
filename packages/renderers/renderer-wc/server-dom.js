const internal = {
	/** Custom Elements by tag name. */
	CTR_BY_TAG: new Map(),

	/** Tag names by Custom Elements. */
	TAG_BY_CTR: new Map(),

	/** InnerHTML by Element. */
	INNER_HTML_BY_ELEMENT: new Map(),
}

/** Returns a Custom Element by a given tag name. */
export const getCustomElementByName = internal.CTR_BY_TAG.get.bind(internal.CTR_BY_TAG);

/** Returns a tag names by a given Custom Element. */
export const getNameByCustomElement = internal.TAG_BY_CTR.get.bind(internal.TAG_BY_CTR);

/** CustomElementRegistry used to register new custom elements and get information about previously registered custom elements. */
export const customElements = {
	/** Defines a new custom element using the given tag name and HTMLElement constructor. */
	define(tag, ctr) {
		internal.CTR_BY_TAG.set(tag, ctr)
		internal.TAG_BY_CTR.set(ctr, tag)
	},
	/** Returns the constructor associated with the given tag name. */
	get(tag) {
		return internal.CTR_BY_TAG.get(tag)
	},
};

/** HTMLElement interface representing any HTML element. */
export const HTMLElement = class HTMLElement {
	constructor() {
		internal.INNER_HTML_BY_ELEMENT.set(this, '')
	}

	/** Attaches a Shadow DOM tree to the current element. */
	attachShadow() {
		return this.shadowRoot = new HTMLElement()
	}

	/** HTML markup contained within the current element. */
	get innerHTML() {
		return internal.INNER_HTML_BY_ELEMENT.get(this) || ''
	}

	set innerHTML(value) {
		internal.INNER_HTML_BY_ELEMENT.set(this, String(value))
	}
};

// shim dom objects onto the global object

globalThis.HTMLElement = HTMLElement;
globalThis.customElements = customElements;
globalThis.window = globalThis;
