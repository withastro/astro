import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';
import { normalizeEntryId } from './plugin-component-entry.js';

export function pluginInternals(
	options: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin {
	let input: Set<string>;

	return {
		name: '@astro/plugin-build-internals',

		applyToEnvironment(environment) {
			return environment.name === 'client' || environment.name === 'ssr' || environment.name === 'prerender';
		},

		config(config, buildEnv) {
			if (buildEnv.command === 'build' && config.build?.ssr) {
				return {
					ssr: {
						// Always bundle Astro runtime when building for SSR
						noExternal: ['astro'],
						// Except for these packages as they're not bundle-friendly. Users with strict package installations
						// need to manually install these themselves if they use the related features.
						external: [
							'sharp', // For sharp image service
						],
					},
				};
			}
		},

		configResolved(config) {
			// Get input from rollupOptions
			const rollupInput = config.build?.rollupOptions?.input;
			if (Array.isArray(rollupInput)) {
				input = new Set(rollupInput);
			} else if (typeof rollupInput === 'string') {
				input = new Set([rollupInput]);
			} else if (rollupInput && typeof rollupInput === 'object') {
				input = new Set(Object.values(rollupInput) as string[]);
			} else {
				input = new Set();
			}
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
					}),
				);
			}
			await Promise.all(promises);
			for (const [_, chunk] of Object.entries(bundle)) {
				if (chunk.fileName.startsWith(options.settings.config.build.assets)) {
					internals.clientChunksAndAssets.add(chunk.fileName);
				}

				if (chunk.type === 'chunk' && chunk.facadeModuleId) {
					const specifiers = mapping.get(chunk.facadeModuleId) || new Set([chunk.facadeModuleId]);
					for (const specifier of specifiers) {
						internals.entrySpecifierToBundleMap.set(normalizeEntryId(specifier), chunk.fileName);
					}
				}
			}
		},
	};
}
