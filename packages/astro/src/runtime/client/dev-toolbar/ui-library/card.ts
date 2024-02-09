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
					display: block;
					border-radius: 8px;
					border: 1px solid rgba(35, 38, 45, 1);
					color: rgba(191, 193, 201, 1);
					text-decoration: none;
					background-color: #13151A;
					box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, 0.10), 0px 1px 2px 0px rgba(0, 0, 0, 0.10), 0px 4px 4px 0px rgba(0, 0, 0, 0.09), 0px 10px 6px 0px rgba(0, 0, 0, 0.05), 0px 17px 7px 0px rgba(0, 0, 0, 0.01), 0px 26px 7px 0px rgba(0, 0, 0, 0.00);
					width: 100%;
    			height: 100%;
				}

				h1, h2, h3, h4, h5, h6 {
					color: #fff;
					font-weight: 600;
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
