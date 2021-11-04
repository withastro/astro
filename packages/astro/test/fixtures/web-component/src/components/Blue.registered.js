export default class BlueElement extends HTMLElement {
	constructor() {
		super()

		this.attachShadow({
			mode: 'open'
		}).innerHTML = `<style>:host { color: blue }</style><slot>`
	}
}


customElements.define('custom-blue', BlueElement)
