const renderOptionsSymbol = /* @__PURE__ */ Symbol.for('astro.renderOptions');
function getRenderOptions(request) {
	return Reflect.get(request, renderOptionsSymbol);
}
function setRenderOptions(request, options) {
	Reflect.set(request, renderOptionsSymbol, options);
}
export { getRenderOptions, setRenderOptions };
