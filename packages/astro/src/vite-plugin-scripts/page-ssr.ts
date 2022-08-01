import { Plugin as VitePlugin } from 'vite';
import { AstroConfig } from '../@types/astro.js';
import { PAGE_SSR_SCRIPT_ID } from './index.js';

import { isPage } from '../core/util.js';
import ancestor from 'common-ancestor-path';
import MagicString from 'magic-string';

export default function astroScriptsPostPlugin({ config }: { config: AstroConfig }): VitePlugin {
	function normalizeFilename(filename: string) {
		if (filename.startsWith('/@fs')) {
			filename = filename.slice('/@fs'.length);
		} else if (filename.startsWith('/') && !ancestor(filename, config.root.pathname)) {
			filename = new URL('.' + filename, config.root).pathname;
		}
		return filename;
	}

	return {
		name: 'astro:scripts:page-ssr',
		enforce: 'post',
		
		transform(this, code, id, options) {
			if (!options?.ssr) return;

			const hasInjectedScript = config._ctx.scripts.some((s) => s.stage === 'page-ssr');
			if (!hasInjectedScript) return;

			const filename = normalizeFilename(id);
			let fileURL: URL;
			try {
				fileURL = new URL(`file://${filename}`);
			} catch (e) {
				// If we can't construct a valid URL, exit early
				return;
			}

			const fileIsPage = isPage(fileURL, config);
			if (!fileIsPage) return;

			const s = new MagicString(code, { filename });
			s.prepend(`import '${PAGE_SSR_SCRIPT_ID}';\n`);

			return {
				code: s.toString(),
				map: s.generateMap(),
			}
		},
	};
}
