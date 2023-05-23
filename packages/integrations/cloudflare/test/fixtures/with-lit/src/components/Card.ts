import { LitElement, html } from 'lit-element/lit-element.js';
import { property, customElement } from 'lit/decorators.js';


export const tagName = 'test-card';

export interface Props {
	title: string;
}

@customElement(tagName)
export class Card extends LitElement {

	@property()
	public title: string = 'card';

	@property()
	protected href?: string;

	@property()
	protected body?: string;

	render() {
		return html`
			<li class="link-card text-slate-400"><h2>${this.title}</h2></li>
		`;
	}
}
