const VIRTUAL_MODULE_ID = 'astro:container';
function astroContainer() {
	return {
		name: VIRTUAL_MODULE_ID,
		enforce: 'pre',
		resolveId: {
			filter: {
				id: new RegExp(`^(${VIRTUAL_MODULE_ID})$`),
			},
			handler() {
				return this.resolve('astro/virtual-modules/container.js');
			},
		},
	};
}
export { astroContainer as default };
