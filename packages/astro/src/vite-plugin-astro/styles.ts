import type { PluginContext } from 'rollup';
import type * as vite from 'vite';

import { STYLE_EXTENSIONS } from '../core/render/util.js';

export type TransformHook = (
	code: string,
	id: string,
	ssr?: boolean
) => Promise<vite.TransformResult>;

interface TransformStyleWithViteOptions {
	id: string;
	source: string;
	lang: string;
	ssr?: boolean;
	viteDevServer?: vite.ViteDevServer;
}

export interface TransformStyleWithVite {
	(options: TransformStyleWithViteOptions): Promise<{
		code: string;
		map: vite.TransformResult['map'];
		deps: Set<string>;
	} | null>;
}

export function createTransformStyleWithViteFn(
	viteConfig: vite.ResolvedConfig
): TransformStyleWithVite {
	const viteCSSPlugin = viteConfig.plugins.find(({ name }) => name === 'vite:css');
	if (!viteCSSPlugin) throw new Error(`vite:css plugin couldn't be found`);
	if (!viteCSSPlugin.transform) throw new Error(`vite:css has no transform() hook`);
	const transformCss = viteCSSPlugin.transform as TransformHook;

	return async function (
		this: PluginContext,
		{ id, source, lang, ssr, viteDevServer }: TransformStyleWithViteOptions
	) {
		if (!STYLE_EXTENSIONS.has(lang)) {
			return null; // only preprocess langs supported by Vite
		}

		// Id must end with valid CSS extension for vite:css to process
		const styleId = `${id}?astro&type=style&lang${lang}`;

		viteDevServer?.moduleGraph.ensureEntryFromUrl(styleId, ssr, false);

		const transformResult = await transformCss.call(this, source, styleId, ssr);

		// NOTE: only `code` and `map` are returned by vite:css
		const { code, map } = transformResult;
		const deps = new Set<string>();

		// Get deps from module created while transforming the styleId by Vite.
		// In build, it's fine that we skip this as it's used by HMR only.
		const mod = viteDevServer?.moduleGraph.getModuleById(styleId);
		if (mod) {
			// Get all @import references
			for (const imported of mod.importedModules) {
				if (imported.file) {
					deps.add(imported.file);
				}
			}
		}

		return { code, map, deps };
	};
}
