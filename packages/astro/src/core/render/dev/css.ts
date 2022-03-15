import type * as vite from 'vite';

import path from 'path';
import { viteID } from '../../util.js';

// https://vitejs.dev/guide/features.html#css-pre-processors
export const STYLE_EXTENSIONS = new Set(['.css', '.pcss', '.postcss', '.scss', '.sass', '.styl', '.stylus', '.less']);

const cssRe = new RegExp(
	`\\.(${Array.from(STYLE_EXTENSIONS)
		.map((s) => s.slice(1))
		.join('|')})($|\\?)`
);
export const isCSSRequest = (request: string): boolean => cssRe.test(request);

/**
 * getStylesForURL
 * Given a filePath URL, crawl Vite’s module graph to find style files
 */
export function getStylesForURL(filePath: URL, viteServer: vite.ViteDevServer): Set<string> {
	const css = new Set<string>();

	// recursively crawl module graph to get all style files imported by parent id
	function crawlCSS(id: string, scanned = new Set<string>()) {
		// note: use .getModulesByFile() to get all related nodes of the same URL
		// using .getModuleById() could cause missing style imports on initial server load
		const relatedMods = viteServer.moduleGraph.getModulesByFile(id) ?? new Set();
		const importedModules = new Set<vite.ModuleNode>();

		for (const relatedMod of relatedMods) {
			if (id === relatedMod.id) {
				scanned.add(id);
				for (const importedMod of relatedMod.importedModules) {
					importedModules.add(importedMod);
				}
			}
		}

		// scan importedModules
		for (const importedModule of importedModules) {
			if (!importedModule.id || scanned.has(importedModule.id)) continue;
			const ext = path.extname(importedModule.url.toLowerCase());
			if (STYLE_EXTENSIONS.has(ext)) {
				css.add(importedModule.url); // note: return `url`s for HTML (not .id, which will break Windows)
			}
			crawlCSS(importedModule.id, scanned);
		}
	}

	crawlCSS(viteID(filePath));

	return css;
}
