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
					box-sizing: border-box;
					display: flex;
					flex-direction: column;
					background: linear-gradient(0deg, #13151A, #13151A), linear-gradient(0deg, #343841, #343841);
					border: 1px solid rgba(52, 56, 65, 1);
					width: min(640px, 100%);
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

				::slotted(h1), ::slotted(h2), ::slotted(h3), ::slotted(h4), ::slotted(h5) {
					font-weight: 600;
					color: #fff;
				}

				#window-title {
					display: flex;
					align-items: center;
					font-weight: 600;
					color: #fff;
					margin: 0;
					font-size: 22px;
				}

				::slotted(h1) {
					font-size: 22px;
				}

				::slotted(h2) {
					font-size: 20px;
				}

				::slotted(h3) {
					font-size: 18px;
				}

				::slotted(h4) {
					font-size: 16px;
				}

				::slotted(h5) {
					font-size: 14px;
				}

				#window-title svg {
					margin-right: 8px;
					height: 1em;
				}

				hr, ::slotted(hr) {
					border: 1px solid rgba(27, 30, 36, 1);
					margin: 1em 0;
				}
			</style>

			<h1 id="window-title">${this.windowIcon ? this.getElementForIcon(this.windowIcon) : ''}${
				this.windowTitle ?? ''
			}</h1>
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
