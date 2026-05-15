const NOOP_MODULE_ID = 'virtual:astro:noop';
const RESOLVED_NOOP_MODULE_ID = '\0' + NOOP_MODULE_ID;
function pluginNoop() {
	return {
		name: 'plugin-noop',
		resolveId: {
			filter: {
				id: new RegExp(`^${NOOP_MODULE_ID}$`),
			},
			handler() {
				return RESOLVED_NOOP_MODULE_ID;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_NOOP_MODULE_ID}$`),
			},
			handler() {
				return 'export const noop = {};';
			},
		},
		generateBundle(_options, bundle) {
			for (const [name, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') continue;
				if (chunk.facadeModuleId === RESOLVED_NOOP_MODULE_ID) {
					delete bundle[name];
				}
			}
		},
	};
}
export { NOOP_MODULE_ID, pluginNoop };
