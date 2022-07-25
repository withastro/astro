import { LitElement, html } from 'lit';

export default class Counter extends LitElement {
	static get properties() {
		return {
			count: {
				type: Number,
			},
		};
	}

	constructor() {
		super();
		this.count = 0;
	}

	increment() {
		this.count++;
	}

	render() {
		return html`
			<div>
				<p>Count: ${this.count}</p>

				<button type="button" @click=${this.increment}>Increment</button>

				<slot />
			</div>
		`;
	}
}

customElements.define('my-counter', Counter);
