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

// Since this fixture is ran in both dev and build, this could register twice. Wrap with a try..catch for now.
try {
	customElements.define('my-counter', Counter);
} catch {}

