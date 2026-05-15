import { normalizeEntryId } from './plugin-component-entry.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';
function getRollupInputAsSet(rollupInput) {
	if (Array.isArray(rollupInput)) {
		return new Set(rollupInput);
	} else if (typeof rollupInput === 'string') {
		return /* @__PURE__ */ new Set([rollupInput]);
	} else if (rollupInput && typeof rollupInput === 'object') {
		return new Set(Object.values(rollupInput));
	} else {
		return /* @__PURE__ */ new Set();
	}
}
function pluginInternals(options, internals) {
	return {
		name: '@astro/plugin-build-internals',
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},
		configEnvironment(environmentName) {
			if (environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.prerender) {
				return {
					build: {
						rollupOptions: {
							// These packages as they're not bundle-friendly. Users with strict package installations
							// need to manually install these themselves if they use the related features.
							external: [
								'sharp',
								// For sharp image service
							],
						},
					},
					resolve: {
						// Always bundle Astro runtime when building for SSR
						noExternal: ['astro', '@astrojs/internal-helpers'],
					},
				};
			}
		},
		async generateBundle(_options, bundle) {
			const input = getRollupInputAsSet(this.environment?.config.build.rollupOptions.input);
			const promises = [];
			const mapping = /* @__PURE__ */ new Map();
			const allInput = /* @__PURE__ */ new Set([...input, ...internals.clientInput]);
			for (const specifier of allInput) {
				promises.push(
					this.resolve(specifier).then((result) => {
						if (result) {
							if (mapping.has(result.id)) {
								mapping.get(result.id).add(specifier);
							} else {
								mapping.set(result.id, /* @__PURE__ */ new Set([specifier]));
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
					const specifiers =
						mapping.get(chunk.facadeModuleId) || /* @__PURE__ */ new Set([chunk.facadeModuleId]);
					for (const specifier of specifiers) {
						internals.entrySpecifierToBundleMap.set(normalizeEntryId(specifier), chunk.fileName);
					}
				}
			}
		},
	};
}
export { pluginInternals };
