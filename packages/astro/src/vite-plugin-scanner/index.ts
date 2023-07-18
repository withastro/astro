import { normalizePath, type Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import type { LogOptions } from '../core/logger/core.js';
import { isEndpoint, isPage } from '../core/util.js';

import { getPrerenderDefault } from '../prerender/utils.js';
import { scan } from './scan.js';

export interface AstroPluginScannerOptions {
	settings: AstroSettings;
	logging: LogOptions;
}

export default function astroScannerPlugin({ settings, logging }: AstroPluginScannerOptions): VitePlugin {
	return {
		name: 'astro:scanner',
		enforce: 'post',

		async transform(this, code, id, options) {
			if (!options?.ssr) return;

			const filename = normalizePath(id);
			let fileURL: URL;
			try {
				fileURL = new URL(`file://${filename}`);
			} catch (e) {
				// If we can't construct a valid URL, exit early
				return;
			}

			const fileIsPage = isPage(fileURL, settings);
			const fileIsEndpoint = isEndpoint(fileURL, settings);
			if (!(fileIsPage || fileIsEndpoint)) return;
			const defaultPrerender = getPrerenderDefault(settings.config);
			const pageOptions = await scan(code, id, settings, logging);

			if (typeof pageOptions.prerender === 'undefined') {
				pageOptions.prerender = defaultPrerender;
			}

			const { meta = {} } = this.getModuleInfo(id) ?? {};
			return {
				code,
				map: null,
				meta: {
					...meta,
					astro: {
						...(meta.astro ?? { hydratedComponents: [], clientOnlyComponents: [], scripts: [] }),
						pageOptions,
					},
				},
			};
		},
	};
}
