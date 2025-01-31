import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('non-deferred-counter')
export class NonDeferredCounter extends LitElement {
	// All set properties are reflected to attributes so its hydration is not
	// hydration-deferred should always be set.
	@property({ type: Number, reflect: true }) count = 0;

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
