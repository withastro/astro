import type { Plugin } from 'vite';
import { addRollupInput } from '../../core/build/add-rollup-input.js';
import type { BuildInternals } from '../../core/build/internal.js';
import type { StaticBuildOptions } from '../../core/build/types.js';
import {
	RESOLVED_RUNTIME_FONT_FETCHER_VIRTUAL_MODULE_ID,
	RUNTIME_FONT_FETCHER_VIRTUAL_MODULE_ID,
} from './constants.js';

export function vitePluginFontsBuild(
	options: StaticBuildOptions,
	internals: BuildInternals,
): Plugin {
	return {
		name: '@astro/plugin-fonts-build',
		enforce: 'pre',
		options(opts) {
			// addRollupInput(opts, [RUNTIME_FONT_FETCHER_VIRTUAL_MODULE_ID]);
		},
		async generateBundle(_opts, bundle) {
			for (const [chunkName, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') {
					continue;
				}
				// console.log(chunk.facadeModuleId)
				// console.log(chunkName)
				// if (chunk.modules[RESOLVED_RUNTIME_FONT_FETCHER_VIRTUAL_MODULE_ID]) {
				// 	internals.fontsRuntimeFontFetcherChunk = chunk
				// 	delete bundle[chunkName]
				// }
				// if (chunk.modules[RESOLVED_SSR_MANIFEST_VIRTUAL_MODULE_ID]) {
				// 	internals.manifestEntryChunk = chunk;
				// 	delete bundle[chunkName];
				// }
				// if (chunkName.startsWith('manifest')) {
				// 	internals.manifestFileName = chunkName;
				// }
				// console.log(chunkName)
			}
		},
		// resolveId(id) {
		// 	if (id === RUNTIME_FONT_FETCHER_VIRTUAL_MODULE_ID) {
		// 		return RESOLVED_RUNTIME_FONT_FETCHER_VIRTUAL_MODULE_ID;
		// 	}
		// },
		// load(id) {
		// 	if (id === RESOLVED_RUNTIME_FONT_FETCHER_VIRTUAL_MODULE_ID) {
		// 		const ids = [...(options.settings.fonts.fontFileById?.keys() ?? [])];

		// 		return {
		// 			code: `
		// 				import { SsrRuntimeFontFetcher } from ${JSON.stringify(new URL('./infra/ssr-runtime-font-fetcher.js', import.meta.url))};

		// 				export const runtimeFontFetcher = new SsrRuntimeFontFetcher({
		// 					ids: new Set(${JSON.stringify(ids)}),
		// 					fetch,
		// 				});
		// 			`,
		// 		};
		// 	}
		// },
	};
}
