// Something at build time injects document.currentScript = undefined instead of
// document.currentScript = null. This causes Sass build to fail because it
// seems to be expecting `=== null`. This set to `undefined` doesn't seem to be
// caused by Lit and only happens at build / test time, but not in dev or
// preview time.
if (globalThis.document) {
	document.currentScript = null;
}

// globalThis.customElements should be defined by the time @lit/reactive-element
// is loaded. If customElements is not defined by this point, something is
// affecting the load order.
const ceDefine = customElements.define;

// We need to patch customElements.define to keep track of the tagName on the
// class itself so that we can transform JSX custom element class definintion to
// a DSD string on the server, because there is no way to get the tagName from a
// CE class otherwise. Not an issue on client:only because the browser supports
// appending a class instance directly to the DOM.
customElements.define = function (tagName, Ctr) {
	Ctr[Symbol.for('tagName')] = tagName;
	return ceDefine.call(this, tagName, Ctr);
};
