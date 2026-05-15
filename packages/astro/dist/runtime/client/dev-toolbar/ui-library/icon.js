import { getIconElement, isDefinedIcon } from './icons.js';
class DevToolbarIcon extends HTMLElement {
	_icon = void 0;
	shadowRoot;
	get icon() {
		return this._icon;
	}
	set icon(name) {
		this._icon = name;
		this.buildTemplate();
	}
	constructor() {
		super();
		this.shadowRoot = this.attachShadow({ mode: 'open' });
		if (this.hasAttribute('icon')) {
			this.icon = this.getAttribute('icon');
		} else {
			this.buildTemplate();
		}
	}
	getIconHTML(icon) {
		if (icon && isDefinedIcon(icon)) {
			return getIconElement(icon)?.outerHTML ?? '';
		}
		return '<slot />';
	}
	buildTemplate() {
		this.shadowRoot.innerHTML = `
			<style>
				svg {
					width: 100%;
					height: 100%;
				}

				@media (forced-colors: active) {
					svg path[fill="#fff"] {
						fill: black;
					}
				}
			</style>
${this.getIconHTML(this._icon)}`;
	}
}
export { DevToolbarIcon };
