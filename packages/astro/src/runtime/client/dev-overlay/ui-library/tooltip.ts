import { getIconElement, isDefinedIcon, type Icon } from './icons.js';

export interface DevOverlayTooltipSection {
	title?: string;
	inlineTitle?: string;
	icon?: Icon;
	content?: string;
	clickAction?: () => void | Promise<void>;
	clickDescription?: string;
}

export class DevOverlayTooltip extends HTMLElement {
	sections: DevOverlayTooltipSection[] = [];
	shadowRoot: ShadowRoot;

	constructor() {
		super();
		this.shadowRoot = this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		this.shadowRoot.innerHTML = `
			<style>
			:host {
				position: absolute;
				display: none;
				color: white;
				background: linear-gradient(0deg, #310A65, #310A65), linear-gradient(0deg, #7118E2, #7118E2);
				border: 1px solid rgba(113, 24, 226, 1);
				border-radius: 4px;
				padding: 0;
				font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
				font-size: 14px;
				margin: 0;
				z-index: 9999999;
				max-width: 45ch;
				width: fit-content;
				min-width: 27ch;
			}

			:host([data-show="true"]) {
				display: block;
			}

			svg {
				vertical-align: bottom;
				margin-right: 4px;
			}

			hr {
				border: 1px solid rgba(136, 58, 234, 0.33);
				padding: 0;
				margin: 0;
			}

			section {
				padding: 8px;
			}

			.section-content {
				max-height: 250px;
    		overflow-y: auto;
			}

			.modal-title {
				display: flex;
				justify-content: space-between;
				align-items: center;
			}

			.modal-main-title {
				font-weight: bold;
			}

			.modal-title + div {
				margin-top: 8px;
			}

			.modal-cta {
				display: block;
				font-weight: bold;
				font-size: 0.9em;
			}

			.clickable-section {
				background: rgba(113, 24, 226, 1);
				padding: 8px;
				border: 0;
				color: white;
				font-family: system-ui, sans-serif;
				text-align: left;
				line-height: 1.2;
				white-space: nowrap;
				text-decoration: none;
				margin: 0;
				width: 100%;
			}

			.clickable-section:hover {
				cursor: pointer;
			}

			code {
				background: rgba(136, 58, 234, 0.33);
				font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
				border-radius: 2px;
				font-size: 14px;
				padding: 2px;
			}
			`;

		const fragment = new DocumentFragment();
		this.sections.forEach((section, index) => {
			const sectionElement = section.clickAction
				? document.createElement('button')
				: document.createElement('section');

			if (section.clickAction) {
				sectionElement.classList.add('clickable-section');
				sectionElement.addEventListener('click', async () => {
					await section.clickAction!();
				});
			}

			sectionElement.innerHTML = `
				${
					section.title
						? `<div class="modal-title"><span class="modal-main-title">
						${section.icon ? this.getElementForIcon(section.icon) : ''}${section.title}</span>${
							section.inlineTitle ?? ''
						}</div>`
						: ''
				}
				${section.content ? `<div class="section-content">${section.content}</div>` : ''}
				${section.clickDescription ? `<span class="modal-cta">${section.clickDescription}</span>` : ''}
			`;
			fragment.append(sectionElement);

			if (index < this.sections.length - 1) {
				fragment.append(document.createElement('hr'));
			}
		});

		this.shadowRoot.append(fragment);
	}

	getElementForIcon(icon: Icon | (string & NonNullable<unknown>)) {
		let iconElement;
		if (isDefinedIcon(icon)) {
			iconElement = getIconElement(icon);
		} else {
			iconElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			iconElement.setAttribute('viewBox', '0 0 16 16');
			iconElement.innerHTML = icon;
		}

		iconElement?.style.setProperty('width', '16px');
		iconElement?.style.setProperty('height', '16px');

		return iconElement?.outerHTML ?? '';
	}
}
