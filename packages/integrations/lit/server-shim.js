import { installWindowOnGlobal } from '@lit-labs/ssr/lib/dom-shim.js';
installWindowOnGlobal();

window.global = window;
document.getElementsByTagName = () => [];
// See https://github.com/lit/lit/issues/2393
document.currentScript = null;

const ceDefine = customElements.define;
customElements.define = function(tagName, Ctr) {
	Ctr[Symbol.for('tagName')] = tagName;
	return ceDefine.call(this, tagName, Ctr);
}
