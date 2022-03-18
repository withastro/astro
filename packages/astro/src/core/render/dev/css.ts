import type * as vite from 'vite';

import path from 'path';
import { unwrapId, viteID } from '../../util.js';

// https://vitejs.dev/guide/features.html#css-pre-processors
export const STYLE_EXTENSIONS = new Set(['.css', '.pcss', '.postcss', '.scss', '.sass', '.styl', '.stylus', '.less']);

const cssRe = new RegExp(
	`\\.(${Array.from(STYLE_EXTENSIONS)
		.map((s) => s.slice(1))
		.join('|')})($|\\?)`
);
export const isCSSRequest = (request: string): boolean => cssRe.test(request);

/** Given a filePath URL, crawl Vite’s module graph to find all style imports. */
export function getStylesForURL(filePath: URL, viteServer: vite.ViteDevServer): Set<string> {
	const importedCssUrls = new Set<string>();

	/** recursively crawl the module graph to get all style files imported by parent id */
	function crawlCSS(_id: string, isFile: boolean, scanned = new Set<string>()) {
		const id = unwrapId(_id);
		const importedModules = new Set<vite.ModuleNode>();
		const moduleEntriesForId = isFile
			? // If isFile = true, then you are at the root of your module import tree.
			  // The `id` arg is a filepath, so use `getModulesByFile()` to collect all
			  // nodes for that file. This is needed for advanced imports like Tailwind.
			  viteServer.moduleGraph.getModulesByFile(id) ?? new Set()
			: // Otherwise, you are following an import in the module import tree.
			  // You are safe to use getModuleById() here because Vite has already
			  // resolved the correct `id` for you, by creating the import you followed here.
			  new Set([viteServer.moduleGraph.getModuleById(id)!]);

		// Collect all imported modules for the module(s).
		for (const entry of moduleEntriesForId) {
			if (id === entry.id) {
				scanned.add(id);
				for (const importedModule of entry.importedModules) {
					importedModules.add(importedModule);
				}
			}
		}

		// scan imported modules for CSS imports & add them to our collection.
		// Then, crawl that file to follow and scan all deep imports as well.
		for (const importedModule of importedModules) {
			if (!importedModule.id || scanned.has(importedModule.id)) {
				continue;
			}
			const ext = path.extname(importedModule.url).toLowerCase();
			if (STYLE_EXTENSIONS.has(ext)) {
				// NOTE: We use the `url` property here. `id` would break Windows.
				importedCssUrls.add(importedModule.url);
			}
			crawlCSS(importedModule.id, false, scanned);
		}
	}

	// Crawl your import graph for CSS files, populating `importedCssUrls` as a result.
	crawlCSS(viteID(filePath), true);
	return importedCssUrls;
}
