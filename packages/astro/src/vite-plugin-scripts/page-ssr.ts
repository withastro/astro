import { Plugin as VitePlugin } from 'vite';
import { AstroSettings } from '../@types/astro.js';
import { PAGE_SSR_SCRIPT_ID } from './index.js';
import MagicString from 'magic-string';
import { isPage } from '../core/util.js';
import { normalizeFilename } from '../vite-plugin-utils/index.js';

export default function astroScriptsPostPlugin({
	settings,
}: {
	settings: AstroSettings;
}): VitePlugin {
	return {
		name: 'astro:scripts:page-ssr',
		enforce: 'post',
		transform(this, code, id, options) {
			if (!options?.ssr) return;

			const hasInjectedScript = settings.scripts.some((s) => s.stage === 'page-ssr');
			if (!hasInjectedScript) return;

			const filename = normalizeFilename({ fileName: id, projectRoot: settings.config.root });
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
