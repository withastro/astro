import type { ModuleLoader } from '../../module-loader/index';

import path from 'path';
import { RuntimeMode } from '../../../@types/astro.js';
import { viteID } from '../../util.js';
import { STYLE_EXTENSIONS } from '../util.js';
import { crawlGraph } from './vite.js';

/** Given a filePath URL, crawl Vite’s module graph to find all style imports. */
export async function getStylesForURL(
	filePath: URL,
	loader: ModuleLoader,
	mode: RuntimeMode
): Promise<{ urls: Set<string>; stylesMap: Map<string, string> }> {
	const importedCssUrls = new Set<string>();
	const importedStylesMap = new Map<string, string>();

	for await (const importedModule of crawlGraph(loader, viteID(filePath), true)) {
		const ext = path.extname(importedModule.url).toLowerCase();
		if (STYLE_EXTENSIONS.has(ext)) {
			// The SSR module is possibly not loaded. Load it if it's null.
			const ssrModule =
				importedModule.ssrModule ?? (await loader.import(importedModule.url));
			if (
				mode === 'development' && // only inline in development
				typeof ssrModule?.default === 'string' // ignore JS module styles
			) {
				importedStylesMap.set(importedModule.url, ssrModule.default);
			} else {
				// NOTE: We use the `url` property here. `id` would break Windows.
				importedCssUrls.add(importedModule.url);
			}
		}
	}

	return {
		urls: importedCssUrls,
		stylesMap: importedStylesMap,
	};
}
