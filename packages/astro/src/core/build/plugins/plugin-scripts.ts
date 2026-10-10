import type { BuildOptions, Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../internal.js';
import { shouldInlineAsset } from './util.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';

/**
 * Vite's preload-helper virtual module. It appears in a chunk's `moduleIds`
 * whenever `__vitePreload` wraps a dynamic import — including *external* dynamic
 * imports, which Rolldown (Vite 8) omits from `chunk.dynamicImports` (unlike
 * Rollup/Vite 7). Inlining and deleting such a chunk before Vite's
 * import-analysis pass runs would leave a raw `__VITE_PRELOAD__` marker in the
 * HTML, causing a runtime `ReferenceError`.
 * @see https://github.com/withastro/astro/issues/17265
 */
const VITE_PRELOAD_HELPER_ID = '\0vite/preload-helper.js';

/**
 * Inline scripts from Astro files directly into the HTML.
 */
export function pluginScripts(internals: BuildInternals): VitePlugin {
	let assetInlineLimit: NonNullable<BuildOptions['assetsInlineLimit']>;

	return {
		name: '@astro/plugin-scripts',

		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client;
		},

		configResolved(config) {
			assetInlineLimit = config.build.assetsInlineLimit;
		},

		async generateBundle(_options, bundle) {
			const outputs = Object.values(bundle);

			// Track ids that are imported by chunks so we don't inline scripts that are imported
			const importedIds = new Set<string>();
			for (const output of outputs) {
				if (output.type === 'chunk') {
					for (const id of output.imports) {
						importedIds.add(id);
					}
				}
			}

			for (const output of outputs) {
				// Try to inline scripts that don't import anything as is within the inline limit
				if (
					output.type === 'chunk' &&
					output.facadeModuleId &&
					internals.discoveredScripts.has(output.facadeModuleId) &&
					!importedIds.has(output.fileName) &&
					output.imports.length === 0 &&
					output.dynamicImports.length === 0 &&
					// Don't inline chunks that still rely on Vite's preload helper (i.e.
					// contain an external dynamic import). Rolldown excludes external
					// modules from `dynamicImports`, so the checks above miss them.
					!output.moduleIds.includes(VITE_PRELOAD_HELPER_ID) &&
					shouldInlineAsset(output.code, output.fileName, assetInlineLimit)
				) {
					internals.inlinedScripts.set(output.facadeModuleId, output.code.trim());
					delete bundle[output.fileName];
				}
			}
		},
	};
}
