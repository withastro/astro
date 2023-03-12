import type { ModuleLoader } from '../../module-loader/index';

import type { RuntimeMode } from '../../../@types/astro.js';
import { viteID } from '../../util.js';
import { isBuildableCSSRequest } from './util.js';
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
		if (isBuildableCSSRequest(importedModule.url)) {
			let ssrModule: Record<string, any>;
			try {
				// The SSR module is possibly not loaded. Load it if it's null.
				ssrModule = importedModule.ssrModule ?? (await loader.import(importedModule.url));
			} catch {
				// The module may not be inline-able, e.g. SCSS partials. Skip it as it may already
				// be inlined into other modules if it happens to be in the graph.
				continue;
			}
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
