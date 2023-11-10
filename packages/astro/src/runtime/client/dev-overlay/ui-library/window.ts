import { getIconElement, isDefinedIcon, type Icon } from './icons.js';

export class DevOverlayWindow extends HTMLElement {
	windowTitle?: string | undefined | null;
	windowIcon?: Icon | undefined | null;
	shadowRoot: ShadowRoot;

	constructor() {
		super();
		this.shadowRoot = this.attachShadow({ mode: 'open' });

		this.windowTitle = this.getAttribute('window-title');
		this.windowIcon = this.hasAttribute('window-icon')
			? (this.getAttribute('window-icon') as Icon)
			: undefined;
	}

	async connectedCallback() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: flex;
					flex-direction: column;
					background: linear-gradient(0deg, #13151A, #13151A), linear-gradient(0deg, #343841, #343841);
					border: 1px solid rgba(52, 56, 65, 1);
					width: 640px;
					height: 480px;
					border-radius: 12px;
					padding: 24px;
					font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
					color: rgba(204, 206, 216, 1);
					position: fixed;
					z-index: 999999999;
					top: 55%;
					left: 50%;
					transform: translate(-50%, -50%);
					box-shadow: 0px 0px 0px 0px rgba(19, 21, 26, 0.30), 0px 1px 2px 0px rgba(19, 21, 26, 0.29), 0px 4px 4px 0px rgba(19, 21, 26, 0.26), 0px 10px 6px 0px rgba(19, 21, 26, 0.15), 0px 17px 7px 0px rgba(19, 21, 26, 0.04), 0px 26px 7px 0px rgba(19, 21, 26, 0.01);
				}

				h1 {
					margin: 0;
					font-weight: 600;
					color: #fff;
				}

				h1 svg {
					vertical-align: text-bottom;
					margin-right: 8px;
				}

				hr {
					border: 1px solid rgba(27, 30, 36, 1);
					margin: 1em 0;
				}
			</style>

			<h1>${this.windowIcon ? this.getElementForIcon(this.windowIcon) : ''}${this.windowTitle ?? ''}</h1>
			<hr />
			<slot />
		`;
	}

	getElementForIcon(icon: Icon) {
		if (isDefinedIcon(icon)) {
			const iconElement = getIconElement(icon);
			iconElement?.style.setProperty('height', '1em');

			return iconElement?.outerHTML;
		} else {
			const iconElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			iconElement.setAttribute('viewBox', '0 0 16 16');
			iconElement.innerHTML = icon;

			return iconElement.outerHTML;
		}
	}
}
