import { LitElement, html } from 'lit';

export default class NonDeferredCounter extends LitElement {
	static get properties() {
		return {
			count: {
				type: Number,
				// All set properties are reflected to attributes so its hydration is
				// not deferred.
				reflect: true,
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
			</div>
		`;
	}
}

// Since this fixture is ran in both dev and build, this could register twice. Wrap with a try..catch for now.
try {
	customElements.define('non-deferred-counter', NonDeferredCounter);
} catch {}
