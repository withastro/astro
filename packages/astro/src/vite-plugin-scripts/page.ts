import { Plugin as VitePlugin } from 'vite';
import { AstroConfig } from '../@types/astro.js';
import { PAGE_SSR_SCRIPT_ID } from './index.js';

import { resolvePages } from '../core/util.js';
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
		name: 'astro:scripts:post',
		enforce: 'post',
		
		transform(this, code, id, options) {
			if (!options?.ssr) return;

			const filename = normalizeFilename(id);
			let fileUrl: URL;
			try {
				fileUrl = new URL(`file://${filename}`);
			} catch (e) {
				// If we can't construct a valid URL, exit early
				return;
			}

			const isPage = fileUrl.pathname.startsWith(resolvePages(config).pathname);
			if (!isPage) return;
			const parts = fileUrl.pathname.slice(resolvePages(config).pathname.length).split('/');
			for (const part of parts) {
				if (part.startsWith('_')) return;
			}
			const hasInjectedScript = config._ctx.scripts.some((s) => s.stage === 'page-ssr');
			if (!hasInjectedScript) return;

			const s = new MagicString(code, { filename });
			s.prepend(`import '${PAGE_SSR_SCRIPT_ID}';\n`);

			return {
				code: s.toString(),
				map: s.generateMap(),
			}
		},
	};
}
