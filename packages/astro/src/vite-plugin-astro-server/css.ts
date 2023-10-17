import type { RuntimeMode } from '../@types/astro.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import { viteID } from '../core/util.js';
import { isBuildableCSSRequest } from './util.js';
import { crawlGraph } from './vite.js';

interface ImportedStyle {
	id: string;
	url: string;
	content: string;
}

/** Given a filePath URL, crawl Vite’s module graph to find all style imports. */
export async function getStylesForURL(
	filePath: URL,
	loader: ModuleLoader,
	mode: RuntimeMode
): Promise<{ urls: Set<string>; styles: ImportedStyle[] }> {
	const importedCssUrls = new Set<string>();
	// Map of url to injected style object. Use a `url` key to deduplicate styles
	const importedStylesMap = new Map<string, ImportedStyle>();

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
				importedStylesMap.set(importedModule.url, {
					id: importedModule.id ?? importedModule.url,
					url: importedModule.url,
					content: ssrModule.default,
				});
			} else {
				// NOTE: We use the `url` property here. `id` would break Windows.
				importedCssUrls.add(importedModule.url);
			}
		}
	}

	return {
		urls: importedCssUrls,
		styles: [...importedStylesMap.values()],
	};
}
