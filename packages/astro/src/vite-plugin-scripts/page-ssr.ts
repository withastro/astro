import MagicString from 'magic-string';
import { normalizePath, type Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { isPage } from '../core/util.js';
import { PAGE_SSR_SCRIPT_ID } from './index.js';

const RESOLVED_ENTRYPOINT_SYMBOL = Symbol('astro:resolved-entrypoint');

export default function astroScriptsPostPlugin({
	settings,
}: {
	settings: AstroSettings;
}): VitePlugin {
	return {
		name: 'astro:scripts:page-ssr',
		enforce: 'post',
		async transform(this, code, id, options) {
			if (!options?.ssr) return;

			const hasInjectedScript = settings.scripts.some((s) => s.stage === 'page-ssr');
			if (!hasInjectedScript) return;

			const filename = normalizePath(id);
			let fileURL: URL;
			try {
				fileURL = new URL(`file://${filename}`);
			} catch (e) {
				// If we can't construct a valid URL, exit early
				return;
			}

			await Promise.all(settings.injectedRoutes.map(async route => {
				if ((route as any)[RESOLVED_ENTRYPOINT_SYMBOL]) return route;
				const resolvedId = await this.resolve(route.entryPoint);
				(route as any)[RESOLVED_ENTRYPOINT_SYMBOL] = resolvedId?.id;
				return route;
			}))

			const fileIsPage = isPage(fileURL, settings);
			let fileIsInjectedRoute = false;
			for (const route of settings.injectedRoutes) {
				console.log((route as any)[RESOLVED_ENTRYPOINT_SYMBOL])
				if ((route as any)[RESOLVED_ENTRYPOINT_SYMBOL] === id) {
					fileIsInjectedRoute = true;
					break;
				}
			}
			if (!(fileIsPage || fileIsInjectedRoute)) return;

			const s = new MagicString(code, { filename });
			s.prepend(`import '${PAGE_SSR_SCRIPT_ID}';\n`);

			return {
				code: s.toString(),
				map: s.generateMap({ hires: 'boundary' }),
			};
		},
	};
}
