import { getIconElement, isDefinedIcon, type Icon } from './icons.js';

export class DevOverlayCard extends HTMLElement {
	icon?: Icon;
	link?: string | undefined | null;
	shadowRoot: ShadowRoot;

	constructor() {
		super();
		this.shadowRoot = this.attachShadow({ mode: 'open' });

		this.link = this.getAttribute('link');
		this.icon = this.hasAttribute('icon') ? (this.getAttribute('icon') as Icon) : undefined;
	}

	connectedCallback() {
		const element = this.link ? 'a' : 'button';

		this.shadowRoot.innerHTML = `
			<style>
				a, button {
					display: block;
					padding: 40px 16px;
					border-radius: 8px;
					border: 1px solid rgba(35, 38, 45, 1);
					color: #fff;
					font-size: 16px;
					font-weight: 600;
					line-height: 19px;
					text-decoration: none;
					background-color: #13151A;
					box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, 0.10), 0px 1px 2px 0px rgba(0, 0, 0, 0.10), 0px 4px 4px 0px rgba(0, 0, 0, 0.09), 0px 10px 6px 0px rgba(0, 0, 0, 0.05), 0px 17px 7px 0px rgba(0, 0, 0, 0.01), 0px 26px 7px 0px rgba(0, 0, 0, 0.00);
				}

				a:hover, button:hover {
					background: rgba(136, 58, 234, 0.33);
					border: 1px solid rgba(113, 24, 226, 1)
				}

				svg {
					display: block;
					margin: 0 auto;
				}

				span {
					margin-top: 8px;
					display: block;
					text-align: center;
				}
			</style>

			<${element}${this.link ? ` href="${this.link}" target="_blank"` : ``}>
				${this.icon ? this.getElementForIcon(this.icon) : ''}
				<span><slot /></span>
			</${element}>
		`;
	}

	getElementForIcon(icon: Icon) {
		let iconElement;
		if (isDefinedIcon(icon)) {
			iconElement = getIconElement(icon);
		} else {
			iconElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			iconElement.setAttribute('viewBox', '0 0 16 16');
			iconElement.innerHTML = icon;
		}

		iconElement?.style.setProperty('height', '24px');
		iconElement?.style.setProperty('width', '24px');

		return iconElement?.outerHTML ?? '';
	}
}
