function getAstroMetadata(modInfo) {
	if (modInfo.meta?.astro) {
		return modInfo.meta.astro;
	}
	return void 0;
}
function createDefaultAstroMetadata() {
	return {
		hydratedComponents: [],
		clientOnlyComponents: [],
		serverComponents: [],
		scripts: [],
		propagation: 'none',
		containsHead: false,
		pageOptions: {},
	};
}
export { createDefaultAstroMetadata, getAstroMetadata };
