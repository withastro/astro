import type * as vite from 'vite';

export const NOOP_MODULE_ID = 'virtual:astro:noop';
const RESOLVED_NOOP_MODULE_ID = '\0' + NOOP_MODULE_ID;

// An empty module that does nothing. This can be used as a placeholder
// when you just need a module to be in the graph.
// We use this for the client build when there are no client modules,
// because the publicDir copying happens in the client build.
export function pluginNoop(): vite.Plugin {
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
			// Delete this bundle so that its not written out to disk.
			for (const [name, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') continue;
				if (chunk.facadeModuleId === RESOLVED_NOOP_MODULE_ID) {
					delete bundle[name];
				}
			}
		},
	};
}
