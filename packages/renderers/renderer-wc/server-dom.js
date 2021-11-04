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

export const customElements = {
	define(tag, ctr) {
		internal.CTR_BY_TAG.set(tag, ctr)
		internal.TAG_BY_CTR.set(ctr, tag)
	},
	get(tag) {
		return internal.CTR_BY_TAG.get(tag)
	},
};

export const HTMLElement = class HTMLElement {
	constructor() {
		internal.INNER_HTML_BY_ELEMENT.set(this, '')
	}

	attachShadow() {
		this.shadowRoot = new HTMLElement()
	}

	get innerHTML() {
		return internal.INNER_HTML_BY_ELEMENT.get(this) || ''
	}

	set innerHTML(value) {
		internal.INNER_HTML_BY_ELEMENT.set(this, String(value))
	}
};

globalThis.HTMLElement = HTMLElement;
globalThis.customElements = customElements;
globalThis.window = globalThis;
