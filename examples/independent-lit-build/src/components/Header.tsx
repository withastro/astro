import { LitElement, html } from 'lit';

import './Header.css';

export class Header extends LitElement {
	static get properties() {
		return {
			text: {
				type: String,
			},
		};
	}

	render() {
		return html`<h1 class="root">${this.text}</h1>`;
	}
}

customElements.define('my-header', Header);
