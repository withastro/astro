import { LitElement, html } from 'lit';

export const tagName = 'my-counter';

class Counter extends LitElement {
	static get properties() {
		return {
			count: {
				type: Number,
			},
			id: {
				type: String,
			}
		};
	}

	constructor() {
		super();
		this.count = this.count || 0;
	}

	decrement() {
		this.count--;
	}

	increment() {
		this.count++;
	}

	render() {
		return html`
			<div id="${this.id}">
				<button type="button" @click=${this.decrement}>-</button>

				<p>Count: ${this.count}</p>

				<button type="button" @click=${this.increment}>+</button>
			</div>
		`;
	}
}

customElements.define(tagName, Counter);
