export class DevToolbarCard extends HTMLElement {
	link?: string | undefined | null;
	clickAction?: () => void | (() => Promise<void>);
	shadowRoot: ShadowRoot;

	constructor() {
		super();
		this.shadowRoot = this.attachShadow({ mode: 'open' });

		this.link = this.getAttribute('link');
	}

	connectedCallback() {
		const element = this.link ? 'a' : this.clickAction ? 'button' : 'div';

		this.shadowRoot.innerHTML += `
			<style>
				:host>a, :host>button, :host>div {
					box-sizing: border-box;
					padding: 16px;
					background: transparent;
					border: none;
					border-bottom: 1px solid #1F2433;
					text-decoration: none;
					width: 100%;
	    			height: 100%;
				}

				h1, h2, h3, h4, h5, h6 {
					color: #fff;
					font-weight: 600;
				}

				a:hover, button:hover {
					background:  rgba(31, 36, 51, 0.5);
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

			<${element}${this.link ? ` href="${this.link}" target="_blank"` : ``} id="astro-overlay-card">
				<slot />
			</${element}>
		`;

		if (this.clickAction) {
			this.shadowRoot
				.getElementById('astro-overlay-card')
				?.addEventListener('click', this.clickAction);
		}
	}
}
