import { getIconElement, isDefinedIcon, type Icon } from './icons.js';

export class DevToolbarHighlight extends HTMLElement {
	icon?: Icon | undefined | null;

	shadowRoot: ShadowRoot;

	constructor() {
		super();
		this.shadowRoot = this.attachShadow({ mode: 'open' });

		this.icon = this.hasAttribute('icon') ? (this.getAttribute('icon') as Icon) : undefined;

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
					z-index: 2000000000;
				}

				.icon {
					width: 24px;
					height: 24px;
					color: white;
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
			if (isDefinedIcon(this.icon)) {
				iconElement = getIconElement(this.icon);
			} else {
				iconElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
				iconElement.setAttribute('viewBox', '0 0 16 16');
				iconElement.innerHTML = this.icon;
			}

			if (iconElement) {
				iconElement?.style.setProperty('width', '16px');
				iconElement?.style.setProperty('height', '16px');

				iconContainer.append(iconElement);
				this.shadowRoot.append(iconContainer);
			}
		}
	}
}
