import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../../core/build/internal.js';

/**
 * `@rollup/plugin-alias` doesn't resolve aliases in Rollup input by default. This plugin fixes it.
 * When https://github.com/rollup/plugins/pull/1402 is merged, we can remove this plugin.
 */
export function vitePluginAliasResolve(internals: BuildInternals): VitePlugin {
	let inputResolve: (id: string) => Promise<string>;

	return {
		name: '@astro/plugin-alias-resolve',
		enforce: 'pre',
		configResolved(config) {
			const viteResolve = config.createResolver();
			inputResolve = async (id) => {
				const resolved = await viteResolve(id, ' ', true);
				return resolved || id;
			};
		},
		async resolveId(id, importer) {
			if (
				!importer &&
				(internals.discoveredHydratedComponents.has(id) ||
					internals.discoveredClientOnlyComponents.has(id))
			) {
				const resolved = await inputResolve(id);
				return await this.resolve(resolved, importer, { skipSelf: true });
			}
		},
	};
}
