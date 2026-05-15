const assetHandlesByEnvironment = /* @__PURE__ */ new WeakMap();
function getHandles(env) {
	let handles = assetHandlesByEnvironment.get(env);
	if (!handles) {
		handles = /* @__PURE__ */ new Set();
		assetHandlesByEnvironment.set(env, handles);
	}
	return handles;
}
function resetHandles(env) {
	assetHandlesByEnvironment.set(env, /* @__PURE__ */ new Set());
}
function emitClientAsset(pluginContext, options) {
	const env = pluginContext.environment;
	const handle = pluginContext.emitFile(options);
	const handles = getHandles(env);
	handles.add(handle);
	return handle;
}
export { emitClientAsset, getHandles, resetHandles };
