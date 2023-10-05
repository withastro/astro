export class DevOverlayWindow extends HTMLElement {
	title: string;

	constructor() {
		super();
		this.title = 'World';
	}

	async connectedCallback() {
		const shadow = this.attachShadow({ mode: 'closed' });
		shadow.innerHTML = `
			<style>
				#astro-dev-window {
					background: linear-gradient(0deg, #13151A, #13151A), linear-gradient(0deg, #343841, #343841);
				}

				#astro-dev-window h1 {
					color: #fff;
				}
			</style>

			<div id="astro-dev-window">
				<h1>${this.title}</h1>
			</div>
		`;
	}
}

interface DevOverlayTooltipSection {
	title?: string;
	icon?: string;
	content?: string;
	clickAction?: () => void;
	clickDescription?: string;
}

export class DevOverlayTooltip extends HTMLElement {
	sections: DevOverlayTooltipSection[] = [];
	dialog: HTMLDialogElement;

	constructor() {
		super();
		this.dialog = document.createElement('dialog');
	}

	connectedCallback() {
		this.style.width = '100%';
		this.innerHTML = `
			<style>
			dialog {
				color: white;
				background: linear-gradient(0deg, #310A65, #310A65), linear-gradient(0deg, #7118E2, #7118E2);
				border: 1px solid rgba(113, 24, 226, 1);
				border-radius: 4px;
				padding: 0;
				font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
				font-size: 14px;
				margin: 0;
			}

			dialog svg {
				vertical-align: bottom;
				margin-right: 4px;
			}

			dialog hr {
				border: 1px solid rgba(136, 58, 234, 0.33);
				padding: 0;
				margin: 0;
			}

			dialog section {
				padding: 8px;
			}

			.modal-title {
				font-weight: bold;
				display: inline-block;
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
			}

			code {
				background: rgba(136, 58, 234, 0.33);
				font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
				border-radius: 2px;
				font-size: 14px;
				padding: 2px;
			}
			`;

		this.sections.forEach((section, index) => {
			const el = document.createElement('section');
			if (section.clickAction) {
				el.classList.add('clickable-section');
				el.addEventListener('click', section.clickAction);
			}

			el.innerHTML = `
				${section.icon ? `${section.icon}` : ''}
				${section.title ? `<span class="modal-title">${section.title}</span>` : ''}
				${section.content ? `<div>${section.content}</div>` : ''}
				${section.clickDescription ? `<span class="modal-cta">${section.clickDescription}</span>` : ''}
			`;
			this.dialog.appendChild(el);

			if (index < this.sections.length - 1) {
				this.dialog.appendChild(document.createElement('hr'));
			}
		});

		this.appendChild(this.dialog);
	}
}

export class DevOverlayHighlight extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	connectedCallback() {
		this.innerHTML = `
			<style>
				astro-overlay-highlight {
					background: linear-gradient(180deg, rgba(224, 204, 250, 0.33) 0%, rgba(224, 204, 250, 0.0825) 100%);
					border: 1px solid rgba(113, 24, 226, 1);
					border-radius: 4px;
					display: block;
					width: 100%;
					height: 100%;
				}
			</style>
		`;
	}
}
