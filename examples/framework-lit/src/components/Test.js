import { LitElement, html } from 'lit';

export const tagName = 'calc-add';

class CalcAdd extends LitElement {
	static get properties() {
		return {
			num: {
				type: Number,
			},
		};
	}

	render() {
		return html` <div>Number: ${this.num}</div> `;
	}
}

customElements.define(tagName, CalcAdd);
