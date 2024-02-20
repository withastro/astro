import { LitElement, html } from 'lit';

export class Message extends LitElement {
	static get properties() {
		return {
			text: {
				type: String,
			},
		};
	}

	render() {
		return html`<p>${this.text}</p>`;
	}
}

customElements.define('my-message', Message);
