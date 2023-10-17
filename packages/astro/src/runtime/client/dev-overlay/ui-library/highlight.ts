import { getIconElement, type Icon } from './icons.js';

export class DevOverlayHighlight extends HTMLElement {
	icon: Icon | (string & NonNullable<unknown>) = '';

	shadowRoot: ShadowRoot;

	constructor() {
		super();
		this.shadowRoot = this.attachShadow({ mode: 'closed' });

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					background: linear-gradient(180deg, rgba(224, 204, 250, 0.33) 0%, rgba(224, 204, 250, 0.0825) 100%);
					border: 1px solid rgba(113, 24, 226, 1);
					border-radius: 4px;
					display: block;
					width: 100%;
					height: 100%;
					position: absolute;
				}

				.icon {
					width: 24px;
					height: 24px;
					background: linear-gradient(0deg, #B33E66, #B33E66), linear-gradient(0deg, #351722, #351722);
					border: 1px solid rgba(53, 23, 34, 1);
					border-radius: 9999px;
					display: flex;
					justify-content: center;
					align-items: center;
					position: absolute;
					top: -15px;
					right: -15px;
				}
			</style>
		`;
	}

	connectedCallback() {
		if (this.icon) {
			let iconContainer = document.createElement('div');
			iconContainer.classList.add('icon');

			let iconElement;
			if (this.icon.startsWith('astro:')) {
				iconElement = getIconElement(this.icon);
				iconElement?.style.setProperty('width', '16px');
				iconElement?.style.setProperty('height', '16px');
			} else {
				iconElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
				iconElement.setAttribute('viewBox', '0 0 16 16');
				iconElement.innerHTML = this.icon;
			}

			if (iconElement) {
				iconContainer.appendChild(iconElement);
				this.shadowRoot.appendChild(iconContainer);
			}
		}
	}
}
