export default class Heading extends HTMLElement {
	constructor() {
		super()

		this.attachShadow({ mode: 'open' }).appendChild(
			document.createElement('h1')
		).appendChild(
			document.createElement('slot')
		)
	}

	connectedCallback() {
		if (this.hasAttribute('level')) {
			this.shadowRoot.firstChild.setAttribute('aria-level', this.getAttribute('level'))
		} else {
			let closest = this
			let level = 1

			while ((closest = /** @type {this} */ (closest.parentNode))) {
				if (sectionElements.has(closest.tagName)) {
					++level
				}
			}

			this.shadowRoot.firstChild.setAttribute('aria-level', String(level))
		}
	}

	disconnectedCallback() {
		this.shadowRoot.firstChild.setAttribute('aria-level', '1')
	}

	static get observedAttributes() {
		return ['level']
	}
}

const sectionElements = new Set(['ARTICLE', 'ASIDE', 'NAV', 'SECTION'])
