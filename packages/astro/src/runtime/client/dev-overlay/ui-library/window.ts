export class DevOverlayWindow extends HTMLElement {
	windowTitle?: string;
	windowIcon?: string;

	constructor() {
		super();
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
				<h1>${this.windowIcon ?? ''}${this.windowTitle ?? ''}</h1>

				<hr />
			</div>
		`;
	}
}
