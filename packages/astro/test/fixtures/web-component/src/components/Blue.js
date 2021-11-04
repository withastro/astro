export default class extends HTMLElement {
	constructor() {
		super()

		this.attachShadow({
			mode: 'open'
		}).innerHTML = `<style>:host { color: blue }</style><slot>`
	}
}
