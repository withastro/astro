import { LitElement, html, css } from 'lit';

export const tagName = 'my-counter';

class Counter extends LitElement {
	static styles = css`
		.counter {
			display: grid;
			font-size: 2em;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			margin-top: 2em;
			place-items: center;
		}

		.counter-message {
			text-align: center;
		}
	`;

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

	decrement() {
		this.count--;
	}

	render() {
		return html`
			<div class="counter">
				<button @click=${this.decrement}>-</button>
				<pre>${this.count}</pre>
				<button @click=${this.increment}>+</button>
			</div>
			<div class="counter-message"><slot></slot></div>
		`;
	}
}

customElements.define(tagName, Counter);
