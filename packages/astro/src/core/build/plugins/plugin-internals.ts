import type { EnvironmentOptions, Plugin as VitePlugin, Rollup } from 'vite';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';
import { normalizeEntryId } from './plugin-component-entry.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';

function getRollupInputAsSet(rollupInput: Rollup.InputOption | undefined): Set<string> {
	if (Array.isArray(rollupInput)) {
		return new Set(rollupInput);
	} else if (typeof rollupInput === 'string') {
		return new Set([rollupInput]);
	} else if (rollupInput && typeof rollupInput === 'object') {
		return new Set(Object.values(rollupInput) as string[]);
	} else {
		return new Set();
	}
}

export function pluginInternals(
	options: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin {
	return {
		name: '@astro/plugin-build-internals',

		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},

		configEnvironment(environmentName): EnvironmentOptions | undefined {
			// Prender environment is only enabled during the build
			if (environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.prerender) {
				return {
					build: {
						rollupOptions: {
							// These packages as they're not bundle-friendly. Users with strict package installations
							// need to manually install these themselves if they use the related features.
							external: [
								'sharp', // For sharp image service
							],
						},
					},
					resolve: {
						// Always bundle Astro runtime when building for SSR
						noExternal: ['astro'],
					},
				};
			}
		},

		async generateBundle(_options, bundle) {
			// Read the rollup input directly from the current environment's config rather than
			// relying on a closure variable from configResolved. With Vite's per-environment config
			// resolution, a shared closure variable would be overwritten by the last environment's
			// configResolved call, causing inputs from one environment (e.g. SSR) to leak into
			// another (e.g. client). This caused server-only modules like @astrojs/node/server.js
			// to be resolved in the client environment, triggering spurious "externalized for
			// browser compatibility" warnings.
			const input = getRollupInputAsSet(this.environment?.config.build.rollupOptions.input);
			const promises = [];
			const mapping = new Map<string, Set<string>>();
			const allInput = new Set([...input, ...internals.clientInput]);
			for (const specifier of allInput) {
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
