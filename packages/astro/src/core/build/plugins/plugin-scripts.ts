import type { BuildOptions, Plugin as VitePlugin, Rollup } from 'vite';
import type { BuildInternals } from '../internal.js';
import { shouldInlineAsset } from './util.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';

type GetModuleInfo = (moduleId: string) => Rollup.ModuleInfo | null;

export type ScriptChunkInfo = Pick<
	Rollup.OutputChunk,
	'code' | 'facadeModuleId' | 'fileName' | 'imports' | 'dynamicImports' | 'moduleIds'
>;

export function chunkHasDynamicImports(
	output: Pick<ScriptChunkInfo, 'dynamicImports' | 'moduleIds'>,
	getModuleInfo: GetModuleInfo,
) {
	return (
		output.dynamicImports.length > 0 ||
		output.moduleIds.some((id) => (getModuleInfo(id)?.dynamicallyImportedIds.length ?? 0) > 0)
	);
}

export function shouldInlineScriptChunk(
	output: ScriptChunkInfo,
	{
		discoveredScripts,
		importedIds,
		assetInlineLimit,
		getModuleInfo,
	}: {
		discoveredScripts: Set<string>;
		importedIds: Set<string>;
		assetInlineLimit: NonNullable<BuildOptions['assetsInlineLimit']>;
		getModuleInfo: GetModuleInfo;
	},
) {
	const facadeModuleId = output.facadeModuleId;
	if (facadeModuleId === null) return false;

	return (
		discoveredScripts.has(facadeModuleId) &&
		!importedIds.has(output.fileName) &&
		output.imports.length === 0 &&
		!chunkHasDynamicImports(output, getModuleInfo) &&
		shouldInlineAsset(output.code, output.fileName, assetInlineLimit)
	);
}

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

			const getModuleInfo = this.getModuleInfo.bind(this);
			for (const output of outputs) {
				// Try to inline scripts that don't import anything as is within the inline limit
				if (
					output.type === 'chunk' &&
					shouldInlineScriptChunk(output, {
						discoveredScripts: internals.discoveredScripts,
						importedIds,
						assetInlineLimit,
						getModuleInfo,
					})
				) {
					internals.inlinedScripts.set(output.facadeModuleId!, output.code.trim());
					delete bundle[output.fileName];
				}
			}
		},
	};
}
