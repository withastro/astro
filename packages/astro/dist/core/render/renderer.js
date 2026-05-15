async function loadRenderer(renderer, moduleLoader) {
	const mod = await moduleLoader.import(renderer.serverEntrypoint.toString());
	if (typeof mod.default !== 'undefined') {
		return {
			...renderer,
			ssr: mod.default,
		};
	}
	return void 0;
}
export { loadRenderer };
