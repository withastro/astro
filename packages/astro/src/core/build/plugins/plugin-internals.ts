import type { Plugin as VitePlugin, UserConfig } from 'vite';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin';
import { normalizeEntryId } from './plugin-component-entry.js';

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

			extra.ssr = {
				external,
				noExternal,
			};
			return extra;
		},

		async generateBundle(_options, bundle) {
			const promises = [];
			const mapping = new Map<string, Set<string>>();
			for (const specifier of input) {
				promises.push(
					this.resolve(specifier).then((result) => {
						if (result) {
							if (mapping.has(result.id)) {
								mapping.get(result.id)!.add(specifier);
							} else {
								mapping.set(result.id, new Set<string>([specifier]));
							}
						}
					})
				);
			}
			await Promise.all(promises);
			for (const [, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'chunk' && chunk.facadeModuleId) {
					const specifiers = mapping.get(chunk.facadeModuleId) || new Set([chunk.facadeModuleId]);
					for (const specifier of specifiers) {
						internals.entrySpecifierToBundleMap.set(normalizeEntryId(specifier), chunk.fileName);
					}
				} else if (chunk.type === 'chunk') {
					for (const id of Object.keys(chunk.modules)) {
						const pageData = internals.pagesByViteID.get(id);
						if (pageData) {
							internals.pageToBundleMap.set(pageData.moduleSpecifier, chunk.fileName);
						}
					}
				}
			}
		},
	};
}

export function pluginInternals(internals: BuildInternals): AstroBuildPlugin {
	return {
		build: 'both',
		hooks: {
			'build:before': ({ input }) => {
				return {
					vitePlugin: vitePluginInternals(input, internals),
				};
			},
		},
	};
}
