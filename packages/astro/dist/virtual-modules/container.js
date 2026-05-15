async function loadRenderers(renderers) {
	const loadedRenderers = await Promise.all(
		renderers.map(async (renderer) => {
			const mod = await import(renderer.serverEntrypoint.toString());
			if (typeof mod.default !== 'undefined') {
				return {
					...renderer,
					ssr: mod.default,
				};
			}
			return void 0;
		}),
	);
	return loadedRenderers.filter((r) => Boolean(r));
}
export { loadRenderers };
