import { Plugin as VitePlugin } from 'vite';
import { AstroSettings } from '../@types/astro.js';
import ancestor from 'common-ancestor-path';
import { isPage, isEndpoint } from '../core/util.js';
import type { LogOptions } from '../core/logger/core.js';
import { error } from '../core/logger/core.js';
import * as colors from 'kleur/colors';
import { scan } from './scan.js';

export default function astroScannerPlugin({ settings, logging }: { settings: AstroSettings, logging: LogOptions }): VitePlugin {
	function normalizeFilename(filename: string) {
		if (filename.startsWith('/@fs')) {
			filename = filename.slice('/@fs'.length);
		} else if (filename.startsWith('/') && !ancestor(filename, settings.config.root.pathname)) {
			filename = new URL('.' + filename, settings.config.root).pathname;
		}
		return filename;
	}
	return {
		name: 'astro:scanner',
		enforce: 'post',

		async transform(this, code, id, options) {
			if (!options?.ssr) return;

			const filename = normalizeFilename(id);
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
			const pageOptions = await scan(code, id)

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
