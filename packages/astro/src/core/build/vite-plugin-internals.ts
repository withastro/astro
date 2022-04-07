import type { Plugin as VitePlugin, UserConfig } from 'vite';
import type { BuildInternals } from './internal.js';

export function vitePluginInternals(input: Set<string>, internals: BuildInternals): VitePlugin {
	return {
		name: '@astro/plugin-build-internals',

		config(config, options) {
			const extra: Partial<UserConfig> = {};
			const noExternal = [],
				external = [];
			if (options.command === 'build' && config.build?.ssr) {
				noExternal.push('astro');
				external.push('shiki');
			}

			// @ts-ignore
			extra.ssr = {
				external,
				noExternal,
			};
			return extra;
		},

		configResolved(resolvedConfig) {
			// Delete this hook because it causes assets not to be built
			const plugins = resolvedConfig.plugins as VitePlugin[];
			const viteAsset = plugins.find((p) => p.name === 'vite:asset');
			if (viteAsset) {
				delete viteAsset.generateBundle;
			}
		},

		async generateBundle(_options, bundle) {
			const promises = [];
			const mapping = new Map<string, string>();
			for (const specifier of input) {
				promises.push(
					this.resolve(specifier).then((result) => {
						if (result) {
							mapping.set(result.id, specifier);
						}
					})
				);
			}
			await Promise.all(promises);
			for (const [, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'chunk' && chunk.facadeModuleId) {
					const specifier = mapping.get(chunk.facadeModuleId) || chunk.facadeModuleId;
					internals.entrySpecifierToBundleMap.set(specifier, chunk.fileName);
				}
			}
		},
	};
}
