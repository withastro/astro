import type * as vite from 'vite';
import type { AstroPluginOptions } from '../@types/astro.js';

const VIRTUAL_MODULE_ID = 'astro:dev-toolbar';
const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

export default function astroDevToolbar({ settings }: AstroPluginOptions): vite.Plugin {
	return {
		name: 'astro:dev-toolbar',
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
					export const loadDevToolbarApps = async () => {
						return [${settings.devToolbarApps
							.map((plugin) => `await safeLoadPlugin(${JSON.stringify(plugin)})`)
							.join(',')}].filter(app => app !== undefined));
					};

					async function safeLoadPlugin(entrypoint) {
						try {
							return (await import(entrypoint)).default;
						} catch (err) {
							console.error("Failed to load dev toolbar app from", entrypoint, err);
							return undefined;
						}
					}
				`;
			}
		},
	};
}
