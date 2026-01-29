import type { Plugin } from 'vite';
import type { StaticBuildOptions } from '../../core/build/types.js';
import {
	RESOLVED_RUNTIME_FONT_FETCHER_VIRTUAL_MODULE_ID,
	RUNTIME_FONT_FETCHER_VIRTUAL_MODULE_ID,
} from './constants.js';

export function vitePluginFontsBuild(options: StaticBuildOptions): Plugin {
	return {
		name: '@astro/plugin-fonts-build',
		resolveId(id) {
			if (id === RUNTIME_FONT_FETCHER_VIRTUAL_MODULE_ID) {
				return RESOLVED_RUNTIME_FONT_FETCHER_VIRTUAL_MODULE_ID;
			}
		},
		load(id) {
			if (id === RESOLVED_RUNTIME_FONT_FETCHER_VIRTUAL_MODULE_ID) {
				const ids = [...(options.settings.fonts.fontFileById?.keys() ?? [])];

				return {
					code: `
						import { SsrRuntimeFontFetcher } from ${JSON.stringify(new URL('./infra/ssr-runtime-font-fetcher.js', import.meta.url))};

						export const runtimeFontFetcher = new SsrRuntimeFontFetcher({
							ids: new Set(${JSON.stringify(ids)}),
							site: ${JSON.stringify(options.settings.config.site ?? null)},
							base: ${JSON.stringify(options.settings.fonts.assetsDir ?? '/')},
							fetch,
						});
					`,
				};
			}
		},
	};
}
