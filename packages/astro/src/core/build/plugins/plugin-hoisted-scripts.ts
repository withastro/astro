import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../../../@types/astro.js';
import { viteID } from '../../util.js';
import type { BuildInternals } from '../internal.js';
import { getPageDataByViteID } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { OutputChunk, StaticBuildOptions } from '../types.js';

function virtualHoistedEntry(id: string) {
	return id.startsWith('/astro/hoisted.js?q=');
}

export function vitePluginHoistedScripts(
	settings: AstroSettings,
	internals: BuildInternals
): VitePlugin {
	return {
		name: '@astro/rollup-plugin-astro-hoisted-scripts',

		resolveId(id) {
			if (virtualHoistedEntry(id)) {
				return id;
			}
		},

		load(id) {
			if (virtualHoistedEntry(id)) {
				let code = '';
				for (let path of internals.hoistedScriptIdToHoistedMap.get(id)!) {
					let importPath = path;
					// `/@fs` is added during the compiler's transform() step
					if (importPath.startsWith('/@fs')) {
						importPath = importPath.slice('/@fs'.length);
					}
					code += `import "${importPath}";`;
				}
				return {
					code,
				};
			}
			return void 0;
		},

		async generateBundle(_options, bundle) {
			let assetInlineLimit = 4096;
			if (
				settings.config.vite?.build &&
				settings.config.vite.build.assetsInlineLimit !== undefined
			) {
				assetInlineLimit = settings.config.vite?.build.assetsInlineLimit;
			}

			const considerInlining = new Map<string, OutputChunk>();
			const importedByOtherScripts = new Set<string>();

			// Find all page entry points and create a map of the entry point to the hashed hoisted script.
			// This is used when we render so that we can add the script to the head.
			Object.entries(bundle).forEach(([id, output]) => {
				if (
					output.type === 'chunk' &&
					output.facadeModuleId &&
					virtualHoistedEntry(output.facadeModuleId)
				) {
					considerInlining.set(id, output);
					output.imports.forEach((imported) => importedByOtherScripts.add(imported));
				}
			});

			for (const [id, output] of considerInlining.entries()) {
				const canBeInlined =
					importedByOtherScripts.has(output.fileName) === false &&
					output.imports.length === 0 &&
					output.dynamicImports.length === 0 &&
					Buffer.byteLength(output.code) <= assetInlineLimit;
				let removeFromBundle = false;
				const facadeId = output.facadeModuleId!;
				const pages = internals.hoistedScriptIdToPagesMap.get(facadeId)!;
				for (const pathname of pages) {
					const vid = viteID(new URL('.' + pathname, settings.config.root));
					const pageInfo = getPageDataByViteID(internals, vid);
					if (pageInfo) {
						if (canBeInlined) {
							pageInfo.hoistedScript = {
								type: 'inline',
								value: output.code,
							};
							removeFromBundle = true;
						} else {
							pageInfo.hoistedScript = {
								type: 'external',
								value: id,
							};
						}
					}
				}

				// Remove the bundle if it was inlined
				if (removeFromBundle) {
					delete bundle[id];
				}
			}
		},
	};
}

export function pluginHoistedScripts(
	options: StaticBuildOptions,
	internals: BuildInternals
): AstroBuildPlugin {
	return {
		targets: ['client'],
		hooks: {
			'build:before': () => {
				return {
					vitePlugin: vitePluginHoistedScripts(options.settings, internals),
				};
			},
		},
	};
}
