import type * as vite from 'vite';
import type { AstroPluginOptions } from '../@types/astro.js';

const VIRTUAL_MODULE_ID = 'astro:dev-overlay';
const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

export default function astroDevOverlay({ settings }: AstroPluginOptions): vite.Plugin {
	return {
		name: 'astro:dev-overlay',
		config() {
			return {
				optimizeDeps: {
					// Optimize CJS dependencies used by the dev toolbar
					include: ['astro > aria-query', 'astro > axobject-query'],
				},
			};
		},
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return resolvedVirtualModuleId;
			}
		},
		async load(id) {
			if (id === resolvedVirtualModuleId) {
				return `
					export const loadDevOverlayPlugins = async () => {
						return [${settings.devToolbarApps
							.map((plugin) => `(await import(${JSON.stringify(plugin)})).default`)
							.join(',')}];
					};
				`;
			}
		},
	};
}
