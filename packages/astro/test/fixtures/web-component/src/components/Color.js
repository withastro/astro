export default class Color extends HTMLElement {
	constructor() {
		super()

		this.style = document.createElement('style')

		this.attachShadow({
			mode: 'open'
		}).append(
			this.style,
			document.createElement('slot')
		)
	}

	connectedCallback() {
		this.style.textContent = `:host { color: ${this.getAttribute('color')} }`
	}

	static get observedAttributes() {
		return ['color']
	}
}
