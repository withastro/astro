import {customElements as litCE} from '@lit-labs/ssr-dom-shim';

// Something at build time injects document.currentScript = undefined instead of
// document.currentScript = null. This causes Sass build to fail because it
// seems to be expecting `=== null`. This set to `undefined` doesn't seem to be
// caused by Lit and only happens at build / test time, but not in dev or
// preview time.
if (globalThis.document) {
	document.currentScript = null;
}

// Astro seems to have a DOM shim and the only real difference that we need out
// of the Lit DOM shim is that the Lit DOM shim does something that triggers
// ReactiveElement.finalize() to be called. So this is the only thing we will
// re-shim since Lit will try to respect other global DOM shims.
globalThis.customElements = litCE;

const litCeDefine = customElements.define;

// We need to patch customElements.define to keep track of the tagName on the
// class itself so that we can transform JSX custom element class definintion to
// a DSD string on the server, because there is no way to get the tagName from a
// CE class otherwise. Not an issue on client:only because the browser supports
// appending a class instance directly to the DOM.
customElements.define = function (tagName, Ctr) {
	Ctr[Symbol.for('tagName')] = tagName;
	return litCeDefine.call(this, tagName, Ctr);
};
