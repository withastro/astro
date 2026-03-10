import type { EnvironmentOptions, Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';
import { normalizeEntryId } from './plugin-component-entry.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';

export function pluginInternals(
	options: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin {
	let input: Set<string>;

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
						// Bundle all dependencies for prerendering to avoid Node.js ESM resolution
						// issues with packages that use extensionless imports (e.g. lucide-svelte).
						// The prerender bundle is ephemeral and only used for static HTML generation.
						noExternal: true,
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
