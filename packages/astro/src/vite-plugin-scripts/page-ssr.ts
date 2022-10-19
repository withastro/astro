import { Plugin as VitePlugin } from 'vite';
import { AstroSettings } from '../@types/astro.js';
import { PAGE_SSR_SCRIPT_ID } from './index.js';

import ancestor from 'common-ancestor-path';
import MagicString from 'magic-string';
import { isPage } from '../core/util.js';

export default function astroScriptsPostPlugin({
	settings,
}: {
	settings: AstroSettings;
}): VitePlugin {
	function normalizeFilename(filename: string) {
		if (filename.startsWith('/@fs')) {
			filename = filename.slice('/@fs'.length);
		} else if (filename.startsWith('/') && !ancestor(filename, settings.config.root.pathname)) {
			filename = new URL('.' + filename, settings.config.root).pathname;
		}
		return filename;
	}

	return {
		name: 'astro:scripts:page-ssr',
		enforce: 'post',

		transform(this, code, id, options) {
			if (!options?.ssr) return;

			const hasInjectedScript = settings.scripts.some((s) => s.stage === 'page-ssr');
			if (!hasInjectedScript) return;

			const filename = normalizeFilename(id);
			let fileURL: URL;
			try {
				fileURL = new URL(`file://${filename}`);
			} catch (e) {
				// If we can't construct a valid URL, exit early
				return;
			}

			const fileIsPage = isPage(fileURL, settings);
			if (!fileIsPage) return;

			const s = new MagicString(code, { filename });
			s.prepend(`import '${PAGE_SSR_SCRIPT_ID}';\n`);

			return {
				code: s.toString(),
				map: s.generateMap(),
			};
		},
	};
}
