const idleDirective = (load, options) => {
	const cb = async () => {
		const hydrate = await load();
		await hydrate();
	};
	const rawOptions = typeof options.value === 'object' ? options.value : void 0;
	const idleOptions = {
		timeout: rawOptions?.timeout,
	};
	if ('requestIdleCallback' in window) {
		window.requestIdleCallback(cb, idleOptions);
	} else {
		setTimeout(cb, idleOptions.timeout || 200);
	}
};
var idle_default = idleDirective;
export { idle_default as default };
