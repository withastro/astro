import MagicString from 'magic-string';
import { normalizePath, type Plugin as VitePlugin } from 'vite';
import { PAGE_SSR_SCRIPT_ID } from './const.js';
import type { InjectedScript } from './index.js';

export interface ScriptsPageSsrPluginOptions {
	scripts: readonly InjectedScript[];
	/** Whether a module is a page, which receives the `page-ssr` scripts. */
	isPage: (file: URL) => boolean;
}

export default function astroScriptsPostPlugin({
	scripts,
	isPage,
}: ScriptsPageSsrPluginOptions): VitePlugin {
	return {
		name: 'astro:scripts:page-ssr',
		enforce: 'post',
		transform(this, code, id) {
			if (this.environment.config.consumer !== 'server') return;

			const hasInjectedScript = scripts.some((s) => s.stage === 'page-ssr');
			if (!hasInjectedScript) return;

			const filename = normalizePath(id);
			let fileURL: URL;
			try {
				fileURL = new URL(`file://${filename}`);
			} catch {
				// If we can't construct a valid URL, exit early
				return;
			}

			const fileIsPage = isPage(fileURL);
			if (!fileIsPage) return;

			const s = new MagicString(code, { filename });
			s.prepend(`import '${PAGE_SSR_SCRIPT_ID}';\n`);

			return {
				code: s.toString(),
				map: s.generateMap({ hires: 'boundary' }),
			};
		},
	};
}
