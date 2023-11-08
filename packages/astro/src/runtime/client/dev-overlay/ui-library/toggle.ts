export class DevOverlayToggle extends HTMLElement {
	shadowRoot: ShadowRoot;

	constructor() {
		super();
		this.shadowRoot = this.attachShadow({ mode: 'open' });

		this.shadowRoot.innerHTML = `
		<style>
			input 
		</style>

		<input type="checkbox" name="checkbox" />
		`;
	}
}
