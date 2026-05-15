const visibleDirective = (load, options, el) => {
	const cb = async () => {
		const hydrate = await load();
		await hydrate();
	};
	const rawOptions = typeof options.value === 'object' ? options.value : void 0;
	const ioOptions = {
		rootMargin: rawOptions?.rootMargin,
	};
	const io = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (!entry.isIntersecting) continue;
			io.disconnect();
			cb();
			break;
		}
	}, ioOptions);
	for (const child of el.children) {
		io.observe(child);
	}
};
var visible_default = visibleDirective;
export { visible_default as default };
