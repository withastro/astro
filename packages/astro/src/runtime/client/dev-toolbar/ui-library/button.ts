type ButtonSize = 'small' | 'medium' | 'large';
type ButtonStyle = 'ghost' | 'outline' | 'purple' | 'gray' | 'red';

export class DevToolbarButton extends HTMLElement {
	size: ButtonSize = 'small';
	buttonStyle: ButtonStyle = 'purple';

	shadowRoot: ShadowRoot;

	constructor() {
		super();
		this.shadowRoot = this.attachShadow({ mode: 'open' });

		if (this.hasAttribute('size')) this.size = this.getAttribute('size') as ButtonSize;

		if (this.hasAttribute('button-style'))
			this.buttonStyle = this.getAttribute('button-style') as ButtonStyle;

		const classes = [`button--${this.size}`, `button--${this.buttonStyle}`];

		this.shadowRoot.innerHTML = `
			<style>
				button {
					border: 1px solid transparent;
					color: #fff;
					border-radius: 4px;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				button:hover {
					cursor: pointer;
				}

				.button--small {
					font-size: 12px;
					padding: 4px 8px;
				}

				.button--medium {
					font-size: 14px;
					padding: 8px 12px;
				}

				.button--large {
					font-size: 16px;
					padding: 12px 16px;
				}

				.button--ghost {
					background: transparent;
				}

				.button--outline {
					background: transparent;
					border-color: #fff;
				}

				.button--purple {
					background: rgba(113, 24, 226, 1);
					border-color: rgba(224, 204, 250, 0.33);
				}

				.button--gray {
					background: rgba(52, 56, 65, 1);
					border-color: rgba(71, 78, 94, 1);
				}

				.button--red {
					background: rgba(179, 62, 102, 1);
					border-color: rgba(249, 196, 215, 0.33);
				}

				/* TODO: Remove "astro-dev-overlay-icon" in Astro 5.0 */
				::slotted(astro-dev-overlay-icon),
				::slotted(astro-dev-toolbar-icon) {
					display: inline-block;
					height: 1em;
					width: 1em;
					margin-left: 0.5em;
				}
			</style>

			<button class="${classes.join(' ')}">
				<slot></slot>
			</button>
		`;
	}
}
