import { Plugin as VitePlugin } from 'vite';
import { AstroSettings } from '../@types/astro.js';
import type { LogOptions } from '../core/logger/core.js';
import { isEndpoint, isPage } from '../core/util.js';
import { normalizeFilename } from '../vite-plugin-utils/index.js';

import { scan } from './scan.js';

export default function astroScannerPlugin({
	settings,
	logging,
}: {
	settings: AstroSettings;
	logging: LogOptions;
}): VitePlugin {
	return {
		name: 'astro:scanner',
		enforce: 'post',

		async transform(this, code, id, options) {
			if (!options?.ssr) return;

			const filename = normalizeFilename(id, settings.config);
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
			const pageOptions = await scan(code, id);

			const { meta = {} } = this.getModuleInfo(id) ?? {};
			return {
				code,
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
