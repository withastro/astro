import type { PluginContext } from 'rollup';
import type * as vite from 'vite';
import type { AstroPluginOptions } from '../@types/astro.js';

const VIRTUAL_MODULE_ID = 'astro:dev-overlay';
const resolvedVirtualModuleId = '\0' + VIRTUAL_MODULE_ID;

export default function astroDevOverlay({ settings }: AstroPluginOptions): vite.Plugin {
	return {
		name: 'astro:dev-overlay',
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return resolvedVirtualModuleId;
			}
		},
		async load(id) {
			if (id === resolvedVirtualModuleId) {
				const resolvedPlugins = await Promise.all(
					settings.devOverlayPlugins.map((plugin) => resolvePlugin.call(this, plugin))
				);

				return `
					export const loadDevOverlayPlugins = async () => {
						return [${resolvedPlugins.map((plugin) => `(await import('${plugin}')).default`).join(',')}];
					};
				`;
			}
		},
	};
}

async function resolvePlugin(this: PluginContext, plugin: string): Promise<string> {
	const resolvedId = await this.resolve(plugin)
		.then((res) => res?.id)
		.catch(() => undefined);
	if (!resolvedId) return plugin;

	return resolvedId;
}
